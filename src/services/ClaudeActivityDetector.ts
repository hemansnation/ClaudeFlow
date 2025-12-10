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

    constructor() {
        // Watch existing terminals
        vscode.window.terminals.forEach(t => this.maybeAttachTo(t));

        // New terminals
        this.disposables.push(vscode.window.onDidOpenTerminal(term => this.maybeAttachTo(term)));

        // Check for command palette usage as fallback
        this.disposables.push(vscode.window.onDidChangeActiveTerminal(() => {
            // Activity detection when switching terminals
        }));
    }

    onEvent(handler: EventHandler) {
        this.handlers.push(handler);
    }

    dispose() {
        this.disposables.forEach(d => d.dispose());
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