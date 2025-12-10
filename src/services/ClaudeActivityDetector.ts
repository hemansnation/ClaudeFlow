import * as vscode from 'vscode';

export type ClaudeEventType = 'TaskStarted' | 'TaskCompleted' | 'AttentionRequired';

export interface ClaudeEvent {
    type: ClaudeEventType;
    timestamp: number;
    raw: string;
}

type EventHandler = (event: ClaudeEvent) => void;

export class ClaudeActivityDetector {
    private handlers: EventHandler[] = [];
    private disposables: vscode.Disposable[] = [];
    private monitoringInterval?: NodeJS.Timeout;
    private lastTerminalCount = 0;
    private knownTerminals = new Set<string>();

    constructor() {
        // Initialize terminal count
        this.lastTerminalCount = vscode.window.terminals.length;
        vscode.window.terminals.forEach(t => this.knownTerminals.add(t.name));

        // Watch existing terminals
        vscode.window.terminals.forEach(t => this.maybeAttachTo(t));

        // New terminals
        this.disposables.push(vscode.window.onDidOpenTerminal(term => {
            this.maybeAttachTo(term);
            this.detectTerminalChange();
        }));

        // Terminal closed
        this.disposables.push(vscode.window.onDidCloseTerminal(term => {
            this.knownTerminals.delete(term.name);
            this.detectTerminalChange();
        }));

        // Check for command palette usage as fallback
        this.disposables.push(vscode.window.onDidChangeActiveTerminal(() => {
            this.detectActivity();
        }));

        // Start fast monitoring for file changes
        this.startPeriodicMonitoring();

        // Monitor file system for Claude changes
        this.monitorClaudeFileSystem();
    }

    onEvent(handler: EventHandler) {
        this.handlers.push(handler);
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
    }

    private startPeriodicMonitoring() {
        // Check for Claude activity every 500ms for faster response
        this.monitoringInterval = setInterval(() => {
            this.checkForClaudeActivity();
        }, 500);
    }

    private async checkForClaudeActivity() {
        // Only check for file changes now - terminal changes are event-driven
        // This is much faster and more efficient
    }

    private detectTerminalChange() {
        const currentCount = vscode.window.terminals.length;

        if (currentCount !== this.lastTerminalCount) {
            this.lastTerminalCount = currentCount;
            console.log(`ClaudeFlow: Terminal count changed to ${currentCount}`);
            this.detectActivity();
        }
    }

    private detectActivity() {
        const terminals = vscode.window.terminals;
        const claudeTerminals = terminals.filter(t => this.isClaudeTerminal(t));

        if (claudeTerminals.length > 0) {
            // Emit activity event when Claude terminals are detected/changed
            this.emit({
                type: 'TaskStarted',
                timestamp: Date.now(),
                raw: `Claude activity detected - ${claudeTerminals.length} Claude terminal(s) active`
            });
        }
    }

    
    
    private monitorClaudeFileSystem() {
        // Monitor common Claude output locations
        const fs = require('fs');
        const path = require('path');

        const watchPaths = [
            path.join(process.env.HOME || '', '.claude'),
            path.join(process.env.HOME || '', '.config', 'claude'),
            '/tmp',
            path.join(process.env.TMPDIR || '/tmp', 'claude-*')
        ];

        watchPaths.forEach(watchPath => {
            try {
                if (fs.existsSync(watchPath)) {
                    this.watchDirectory(watchPath);
                }
            } catch (error) {
                console.warn(`ClaudeFlow: Cannot watch ${watchPath}:`, error);
            }
        });
    }

    private watchDirectory(dirPath: string) {
        const fs = require('fs');
        const path = require('path');

        try {
            fs.readdir(dirPath, (err: any, files: string[]) => {
                if (err) return;

                files.forEach(file => {
                    const fullPath = path.join(dirPath, file);

                    // Watch for changes in Claude-related files
                    if (this.isClaudeFile(file)) {
                        fs.watchFile(fullPath, (curr: any, prev: any) => {
                            if (curr.mtime > prev.mtime) {
                                this.handleFileChange(fullPath);
                            }
                        });
                    }
                });
            });
        } catch (error) {
            console.warn(`ClaudeFlow: Cannot monitor directory ${dirPath}:`, error);
        }
    }

    private isClaudeFile(filename: string): boolean {
        return filename.includes('claude') ||
               filename.includes('output') ||
               filename.includes('log') ||
               filename.endsWith('.clauderc');
    }

    private handleFileChange(filePath: string) {
        console.log(`ClaudeFlow: File changed: ${filePath}`);

        // Read the file to detect activity patterns
        const fs = require('fs');
        try {
            const content = fs.readFileSync(filePath, 'utf8').slice(-1000); // Last 1000 chars
            this.handleTerminalOutput(content);

            // Also emit a generic completion event for any Claude file activity
            this.emit({
                type: 'TaskCompleted',
                timestamp: Date.now(),
                raw: `Claude file activity detected in: ${filePath}`
            });
        } catch (error) {
            console.warn(`ClaudeFlow: Cannot read file ${filePath}:`, error);
        }
    }

    // Public method for testing
    public emit(event: ClaudeEvent) {
        this.handlers.forEach(h => h(event));
    }

    private maybeAttachTo(terminal: vscode.Terminal) {
        if (!this.isClaudeTerminal(terminal)) return;

        // Try to attach to terminal data events if available
        // Note: This is a limited approach as VS Code extension API
        // doesn't provide direct terminal output monitoring

        console.log(`ClaudeFlow: Attached to terminal "${terminal.name}" for activity detection`);

        // Check if we can use the newer API (VS Code 1.57+)
        try {
            // @ts-ignore - This API might not be available in all VS Code versions
            if (vscode.window.onDidWriteTerminalData) {
                const disposable = (vscode.window as any).onDidWriteTerminalData((e: any) => {
                    if (e.terminal === terminal) {
                        this.handleTerminalOutput(e.data);
                    }
                });
                this.disposables.push(disposable);
            }
        } catch (error) {
            console.warn('ClaudeFlow: Terminal data monitoring not available, falling back to file-based detection');
            this.setupFileBasedDetection();
        }
    }

    private setupFileBasedDetection() {
        // Try to monitor Claude's output files or logs
        const claudeOutputPaths = [
            `${process.env.HOME}/.claude/output.log`,
            `${process.env.HOME}/.config/claude/logs/`,
            '/tmp/claude-output.log'
        ];

        claudeOutputPaths.forEach(path => {
            if (path.endsWith('.log')) {
                this.monitorLogFile(path);
            }
        });
    }

    private monitorLogFile(filePath: string) {
        try {
            const fs = require('fs');
            if (fs.existsSync(filePath)) {
                console.log(`ClaudeFlow: Monitoring Claude log file: ${filePath}`);

                // Simple file monitoring implementation
                const watcher = fs.watchFile(filePath, (curr: any, prev: any) => {
                    if (curr.size > prev.size) {
                        // File grew, read new content
                        const stream = fs.createReadStream(filePath, { start: prev.size });
                        let data = '';
                        stream.on('data', (chunk: any) => {
                            data += chunk;
                        });
                        stream.on('end', () => {
                            this.handleTerminalOutput(data);
                        });
                    }
                });

                // Store for cleanup
                this.disposables.push({ dispose: () => fs.unwatchFile(filePath) });
            }
        } catch (error) {
            console.warn(`ClaudeFlow: Cannot monitor log file ${filePath}:`, error);
        }
    }

    private isClaudeTerminal(terminal: vscode.Terminal): boolean {
        const name = terminal.name.toLowerCase();
        if (name.includes('claude') || name.includes('claude code') || name.includes('claudeflow')) {
            return true;
        }

        const optionsName = terminal.creationOptions?.name;
        if (optionsName && optionsName.toLowerCase().includes('claude')) {
            return true;
        }

        return false;
    }

    private handleTerminalOutput(data: string) {
        const trimmed = data.trim();

        // Simple heuristics – refine as needed
        if (this.looksLikeTaskStart(trimmed)) {
            this.emit({ type: 'TaskStarted', timestamp: Date.now(), raw: trimmed });
        } else if (this.looksLikeTaskComplete(trimmed)) {
            this.emit({ type: 'TaskCompleted', timestamp: Date.now(), raw: trimmed });
        } else if (this.looksLikeAttentionRequired(trimmed)) {
            this.emit({ type: 'AttentionRequired', timestamp: Date.now(), raw: trimmed });
        }
    }

    private looksLikeTaskStart(line: string): boolean {
        return /starting/i.test(line) ||
               /working on/i.test(line) ||
               /I'll help/i.test(line) ||
               /Let me/i.test(line) ||
               /I'm going to/i.test(line);
    }

    private looksLikeTaskComplete(line: string): boolean {
        return /done|completed|finished|success/i.test(line) ||
               /Task completed/i.test(line) ||
               /All set/i.test(line) ||
               /Here's the result/i.test(line) ||
               /I've completed/i.test(line);
    }

    private looksLikeAttentionRequired(line: string): boolean {
        return /permission|approve|waiting|input|confirm|continue/i.test(line) ||
               /Would you like me to/i.test(line) ||
               /Should I/i.test(line) ||
               /Do you want me to/i.test(line) ||
               /Please confirm/i.test(line) ||
               /Press Enter to continue/i.test(line);
    }
}