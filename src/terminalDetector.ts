import * as vscode from 'vscode';
import { claudeEventBus } from './eventBus';

export class TerminalDetector {
    private disposables: vscode.Disposable[] = [];
    private activeClaudeTerminals = new Set<vscode.Terminal>();

    constructor() {
        this.setupTerminalListeners();
    }

    private setupTerminalListeners(): void {
        // Watch for new terminals
        this.disposables.push(
            vscode.window.onDidOpenTerminal((terminal) => {
                this.checkTerminal(terminal);
            })
        );

        // Monitor terminal data (text output) - requires VS Code 1.74+
        if ('onDidWriteTerminalData' in vscode.window) {
            // @ts-ignore - API exists at runtime but not in types
            this.disposables.push(
                (vscode.window as any).onDidWriteTerminalData((e: any) => {
                    if (this.isClaudeTerminal(e.terminal)) {
                        this.analyzeTerminalOutput(e.terminal, e.data);
                    }
                })
            );
        } else {
            console.warn('VS Code version does not support terminal output monitoring');
        }

        // Check existing terminals on activation
        vscode.window.terminals.forEach(terminal => {
            this.checkTerminal(terminal);
        });
    }

    private checkTerminal(terminal: vscode.Terminal): void {
        const name = terminal.name.toLowerCase();

        // Safely access creation options
        let creationCommand = '';
        try {
            creationCommand = (terminal.creationOptions as any)?.shellPath?.toLowerCase() || '';
        } catch (error) {
            // ExtensionTerminalOptions might not have shellPath
        }

        // Check if this looks like a Claude Code terminal
        const claudeIndicators = [
            'claude',
            'anthropic',
            'claude-code',
            'claudecode'
        ];

        const isClaude = claudeIndicators.some(indicator =>
            name.includes(indicator) || creationCommand.includes(indicator)
        );

        if (isClaude) {
            this.activeClaudeTerminals.add(terminal);
            console.log(`Claude terminal detected: ${terminal.name}`);

            // Start monitoring this terminal
            this.monitorTerminal(terminal);
        }
    }

    private isClaudeTerminal(terminal: vscode.Terminal): boolean {
        return this.activeClaudeTerminals.has(terminal);
    }

    private monitorTerminal(terminal: vscode.Terminal): void {
        // Terminal is already identified as Claude-related
        // The onDidWriteTerminalData will handle output analysis
    }

    private analyzeTerminalOutput(terminal: vscode.Terminal, data: string): void {
        const output = data.toString();

        // Task started patterns
        const taskStartedPatterns = [
            /^✓ /m,
            /^▶ /m,
            /Starting task/i,
            /Beginning/i,
            /Running/i
        ];

        // Task completed patterns
        const taskCompletedPatterns = [
            /✓ Task completed/i,
            /✨ Done/i,
            /Completed successfully/i,
            /Task finished/i,
            /All set/i
        ];

        // User attention required patterns
        const attentionPatterns = [
            /\?/m,
            /Permission required/i,
            /Please confirm/i,
            /Need input/i,
            /Waiting for user/i,
            /Press Enter to continue/i,
            /Continue\?/i
        ];

        // Claude idle patterns
        const idlePatterns = [
            /I'm ready/i,
            /What would you like/i,
            /How can I help/i,
            /Waiting for your next instruction/i
        ];

        // Analyze for task started
        if (taskStartedPatterns.some(pattern => pattern.test(output))) {
            claudeEventBus.emitTaskStarted('terminal', {
                terminalName: terminal.name,
                output: output.trim()
            });
        }

        // Analyze for task completed
        if (taskCompletedPatterns.some(pattern => pattern.test(output))) {
            claudeEventBus.emitTaskCompleted('terminal', {
                terminalName: terminal.name,
                output: output.trim()
            });
        }

        // Analyze for user attention required
        if (attentionPatterns.some(pattern => pattern.test(output))) {
            claudeEventBus.emitUserAttentionRequired('terminal', {
                terminalName: terminal.name,
                output: output.trim()
            });
        }

        // Analyze for Claude idle
        if (idlePatterns.some(pattern => pattern.test(output))) {
            claudeEventBus.emitClaudeIdle('terminal', {
                terminalName: terminal.name,
                output: output.trim()
            });
        }
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.activeClaudeTerminals.clear();
    }
}