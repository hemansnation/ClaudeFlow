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

    constructor() {
        // Watch existing terminals
        vscode.window.terminals.forEach(t => this.maybeAttachTo(t));

        // New terminals
        vscode.window.onDidOpenTerminal(term => this.maybeAttachTo(term));
    }

    onEvent(handler: EventHandler) {
        this.handlers.push(handler);
    }

    private maybeAttachTo(terminal: vscode.Terminal) {
        if (!this.isClaudeTerminal(terminal)) return;

        // Terminal data listener (VS Code >= 1.57)
        // @ts-ignore - API might not be available in all VS Code versions
        if (vscode.window.onDidWriteTerminalData) {
            (vscode.window as any).onDidWriteTerminalData((e: any) => {
                if (e.terminal === terminal) {
                    this.handleTerminalOutput(e.data);
                }
            });
        }
    }

    private isClaudeTerminal(terminal: vscode.Terminal): boolean {
        const name = terminal.name.toLowerCase();
        return name.includes('claude');
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
        return /starting/i.test(line) || /working on/i.test(line);
    }

    private looksLikeTaskComplete(line: string): boolean {
        return /done/i.test(line) || /task completed/i.test(line);
    }

    private looksLikeAttentionRequired(line: string): boolean {
        return /permission/i.test(line) ||
               /approve/i.test(line) ||
               /waiting for your input/i.test(line);
    }

    private emit(evt: ClaudeEvent) {
        this.handlers.forEach(h => h(evt));
    }
}