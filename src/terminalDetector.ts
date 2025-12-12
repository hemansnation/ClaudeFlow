import * as vscode from 'vscode';
import { claudeEventBus } from './eventBus';

export class TerminalDetector {
    private disposables: vscode.Disposable[] = [];
    private activeClaudeTerminals = new Set<vscode.Terminal>();
    private lastExitTime = new Map<string, number>(); // Track exit sounds per terminal
    private lastStartupTime = new Map<string, number>(); // Track startup sounds per terminal
    private readonly EXIT_COOLDOWN = 5000; // 5 seconds cooldown between exit sounds
    private readonly STARTUP_COOLDOWN = 10000; // 10 seconds cooldown between startup sounds

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

        // Note: Terminal monitoring requires VS Code API proposal
        // For production release, we'll detect by terminal name instead

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

        // Only check for complete commands (with newlines) to avoid triggering on keystrokes
        if (!output.includes('\n')) {
            return; // Ignore partial input/keystrokes
        }

        // Detect claude startup - only when claude is at the beginning of a line followed by space/newline
        const claudeStartPattern = /^claude\s*$/m;
        const claudeWithArgsPattern = /^claude\s+/m;

        if (claudeStartPattern.test(output.trim()) || claudeWithArgsPattern.test(output.trim())) {
            claudeEventBus.emitTaskStarted('terminal', {
                terminalName: terminal.name,
                output: output.trim(),
                reason: 'claude_command_detected'
            });
            return;
        }

        // Detect claude exit patterns
        const exitPatterns = [
            /exit\s*$/m,                    // "exit" command
            /quit\s*$/m,                    // "quit" command
            /\x04/,                         // Ctrl+D (EOF character)
            /Bye!/i,                        // Claude's actual goodbye message
            /Goodbye/i,                     // Claude's goodbye message
            /Session ended/i,               // Claude session end
            /Total cost:/i,                 // Session summary (appears at exit)
            /Total duration/i,              // Session summary (appears at exit)
            /Usage:/i,                      // Session summary (appears at exit)
        ];

        if (exitPatterns.some(pattern => pattern.test(output))) {
            // Check cooldown to prevent multiple exit sounds
            const terminalKey = `${terminal.name}_terminal`;
            const now = Date.now();
            const lastExit = this.lastExitTime.get(terminalKey) || 0;

            if (now - lastExit > this.EXIT_COOLDOWN) {
                this.lastExitTime.set(terminalKey, now);
                claudeEventBus.emitTaskCompleted('terminal', {
                    terminalName: terminal.name,
                    output: output.trim(),
                    reason: 'claude_exit_detected'
                });
            }
            return;
        }

        // Detect permission/confirmation request patterns
        const permissionPatterns = [
            /\?\s*$/m,                                   // Question at end of line
            /\by\/n\b/i,                                // "y/n" confirmation
            /\byes\/no\b/i,                             // "yes/no" confirmation
            /\[y\/n\]/i,                               // [y/n] prompt
            /\[yes\/no\]/i,                             // [yes/no] prompt
            /\(y\/n\)/i,                               // (y/n) prompt
            /continue\?/i,                              // "continue?" prompt
            /proceed\?/i,                               // "proceed?" prompt
            /allow\?/i,                                 // "allow?" prompt
            /confirm\?/i,                               // "confirm?" prompt
            /permission required/i,                     // "permission required"
            /access granted/i,                          // "access granted" (after permission)
            /allow this action/i,                       // "allow this action"
            /do you want to/i,                          // "do you want to" questions
            /are you sure/i,                            // "are you sure" confirmation
            /is this ok/i,                              // "is this ok" confirmation
        ];

        if (permissionPatterns.some(pattern => pattern.test(output))) {
            claudeEventBus.emitUserAttentionRequired('terminal', {
                terminalName: terminal.name,
                output: output.trim(),
                reason: 'permission_request_detected'
            });
            return;
        }

        // Also check if terminal name contains "claude" (for when claude creates its own terminal)
        const terminalIsClaude = terminal.name.toLowerCase().includes('claude');

        if (terminalIsClaude && !this.isClaudeTerminal(terminal)) {
            this.activeClaudeTerminals.add(terminal);
            claudeEventBus.emitTaskStarted('terminal', {
                terminalName: terminal.name,
                output: output.trim(),
                reason: 'claude_terminal_name'
            });
        }
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
        this.activeClaudeTerminals.clear();
    }
}