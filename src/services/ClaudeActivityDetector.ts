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

        // For now, we'll use command simulation since terminal output monitoring
        // requires a different approach in VS Code extension API
        console.log(`ClaudeFlow: Attached to terminal "${terminal.name}" for activity detection`);
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