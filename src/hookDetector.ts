import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { claudeEventBus } from './eventBus';

export interface HookEvent {
    type: 'pre-task' | 'post-task' | 'permission-request' | 'user-input';
    timestamp: Date;
    data: any;
}

export class HookDetector {
    private disposables: vscode.Disposable[] = [];
    private hookFiles: string[] = [];
    private watchers: fs.FSWatcher[] = [];

    constructor() {
        this.detectHookFiles();
        this.setupHookMonitoring();
    }

    private detectHookFiles(): void {
        const possibleHookPaths = [
            // User's home directory Claude hooks
            path.join(os.homedir(), '.claude', 'hooks'),
            path.join(os.homedir(), '.claude-code', 'hooks'),
            path.join(os.homedir(), '.config', 'claude', 'hooks'),

            // Workspace local hooks
            path.join(vscode.workspace.rootPath || '', '.claude', 'hooks'),
            path.join(vscode.workspace.rootPath || '', 'claude-hooks'),

            // Common Claude Code hook locations
            path.join(os.homedir(), 'claude-hooks'),
            path.join(process.cwd(), '.claude-hooks')
        ];

        possibleHookPaths.forEach(hookPath => {
            if (fs.existsSync(hookPath)) {
                this.hookFiles.push(...this.findHookFilesInDirectory(hookPath));
            }
        });

        // Also check for individual hook files
        const individualHookFiles = [
            path.join(os.homedir(), '.claude-hooks.json'),
            path.join(os.homedir(), '.claude-config.json'),
            path.join(vscode.workspace.rootPath || '', '.claude-hooks.json')
        ];

        individualHookFiles.forEach(file => {
            if (fs.existsSync(file)) {
                this.hookFiles.push(file);
            }
        });
    }

    private findHookFilesInDirectory(dir: string): string[] {
        try {
            const files = fs.readdirSync(dir, { withFileTypes: true });
            const hookFiles: string[] = [];

            files.forEach(file => {
                const fullPath = path.join(dir, file.name);

                if (file.isFile() && this.isHookFile(file.name)) {
                    hookFiles.push(fullPath);
                } else if (file.isDirectory()) {
                    // Recursively search subdirectories
                    hookFiles.push(...this.findHookFilesInDirectory(fullPath));
                }
            });

            return hookFiles;
        } catch (error) {
            console.warn(`Cannot read hook directory ${dir}:`, error);
            return [];
        }
    }

    private isHookFile(fileName: string): boolean {
        const hookExtensions = ['.js', '.py', '.sh', '.json', '.yml', '.yaml'];
        const hookPatterns = [
            /hook/i,
            /claude/i,
            /anthropic/i,
            /task/i,
            /permission/i
        ];

        const hasValidExtension = hookExtensions.some(ext => fileName.endsWith(ext));
        const matchesPattern = hookPatterns.some(pattern => pattern.test(fileName));

        return hasValidExtension && matchesPattern;
    }

    private setupHookMonitoring(): void {
        // Monitor existing hook files for changes
        this.hookFiles.forEach(hookFile => {
            this.monitorHookFile(hookFile);
        });

        // Monitor for new hook files in real-time
        this.setupFileSystemWatchers();

        // Monitor VS Code settings for Claude hooks
        this.monitorVscodeSettings();
    }

    private monitorHookFile(hookFile: string): void {
        try {
            // Read and parse hook file
            const content = fs.readFileSync(hookFile, 'utf8');
            this.parseHookFile(hookFile, content);

            // Watch for changes
            fs.watchFile(hookFile, () => {
                try {
                    const updatedContent = fs.readFileSync(hookFile, 'utf8');
                    this.parseHookFile(hookFile, updatedContent);
                } catch (error) {
                    console.error(`Error reading updated hook file ${hookFile}:`, error);
                }
            });
        } catch (error) {
            console.error(`Error monitoring hook file ${hookFile}:`, error);
        }
    }

    private parseHookFile(filePath: string, content: string): void {
        try {
            // Handle JSON hook files
            if (filePath.endsWith('.json')) {
                const hookConfig = JSON.parse(content);
                this.processJsonHookConfig(hookConfig, filePath);
            }
            // Handle script hook files (look for specific patterns)
            else {
                this.processScriptHookFile(content, filePath);
            }
        } catch (error) {
            console.error(`Error parsing hook file ${filePath}:`, error);
        }
    }

    private processJsonHookConfig(config: any, source: string): void {
        if (config.hooks) {
            Object.entries(config.hooks).forEach(([hookName, hookData]) => {
                claudeEventBus.emit({
                    type: 'userAttentionRequired',
                    timestamp: new Date(),
                    source: `hook:${source}`,
                    details: {
                        hookName,
                        hookData,
                        hookType: 'json-config'
                    }
                });
            });
        }

        // Look for task-related hooks
        if (config.taskHooks) {
            config.taskHooks.forEach((hook: any) => {
                if (hook.event === 'start') {
                    claudeEventBus.emitTaskStarted('hook', { hook, source });
                } else if (hook.event === 'complete') {
                    claudeEventBus.emitTaskCompleted('hook', { hook, source });
                }
            });
        }
    }

    private processScriptHookFile(content: string, source: string): void {
        // Look for Claude-specific patterns in script files
        const patterns = [
            /claude.*start/i,
            /anthropic.*begin/i,
            /task.*initiated/i,
            /permission.*required/i,
            /waiting.*user/i
        ];

        patterns.forEach(pattern => {
            if (pattern.test(content)) {
                claudeEventBus.emitUserAttentionRequired('hook', {
                    source,
                    pattern: pattern.source,
                    detectedPattern: 'script-hook'
                });
            }
        });
    }

    private setupFileSystemWatchers(): void {
        // Watch common hook directories for new files
        const directoriesToWatch = [
            path.join(os.homedir(), '.claude'),
            path.join(os.homedir(), '.claude-code'),
            vscode.workspace.rootPath
        ];

        directoriesToWatch.forEach(dir => {
            if (dir && fs.existsSync(dir)) {
                try {
                    const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
                        if (filename && this.isHookFile(filename.toString())) {
                            const fullPath = path.join(dir, filename.toString());

                            // Add to our list if it's new
                            if (!this.hookFiles.includes(fullPath)) {
                                this.hookFiles.push(fullPath);
                                this.monitorHookFile(fullPath);
                            }
                        }
                    });

                    this.watchers.push(watcher);
                } catch (error) {
                    console.warn(`Cannot watch directory ${dir}:`, error);
                }
            }
        });
    }

    private monitorVscodeSettings(): void {
        // Watch for Claude Code related VS Code settings
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('claude') ||
                    e.affectsConfiguration('anthropic') ||
                    e.affectsConfiguration('claudeCode')) {

                    claudeEventBus.emitUserAttentionRequired('vscode-settings', {
                        changedConfigurations: e.affectsConfiguration.toString(),
                        source: 'vscode-configuration-change'
                    });
                }
            })
        );
    }

    public getHookFiles(): string[] {
        return [...this.hookFiles];
    }

    public dispose(): void {
        // Cleanup file watchers
        this.watchers.forEach(watcher => {
            try {
                if ('close' in watcher) {
                    (watcher as any).close();
                }
            } catch (error) {
                console.warn('Error closing file watcher:', error);
            }
        });

        // Cleanup VS Code disposables
        this.disposables.forEach(d => d.dispose());
    }
}