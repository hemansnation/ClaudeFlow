import * as vscode from 'vscode';
import { claudeEventBus } from './eventBus';

export interface OutputPattern {
    name: string;
    pattern: RegExp;
    eventType: 'taskStarted' | 'taskCompleted' | 'userAttentionRequired' | 'claudeIdle';
    description: string;
}

export class OutputPatternDetector {
    private disposables: vscode.Disposable[] = [];
    private patterns: OutputPattern[] = [];

    constructor() {
        this.setupDefaultPatterns();
        this.setupOutputChannelListeners();
    }

    private setupDefaultPatterns(): void {
        this.patterns = [
            // Task Started Patterns
            {
                name: 'claude-thinking',
                pattern: /^(▶|Thinking|Starting|Begin|Initializing)/mi,
                eventType: 'taskStarted',
                description: 'Claude starts a new task'
            },
            {
                name: 'tool-execution',
                pattern: /Using \w+ (tool|command)/i,
                eventType: 'taskStarted',
                description: 'Claude executes a tool'
            },

            // Task Completed Patterns
            {
                name: 'task-success',
                pattern: /(✓|✨|Done|Completed|Finished|All set)/mi,
                eventType: 'taskCompleted',
                description: 'Claude completes a task successfully'
            },
            {
                name: 'file-changed',
                pattern: /(Created|Updated|Modified|Deleted) \S+/i,
                eventType: 'taskCompleted',
                description: 'Claude modifies files'
            },

            // User Attention Required Patterns
            {
                name: 'permission-request',
                pattern: /\b(Permission|Confirm|Allow|Proceed)\b/i,
                eventType: 'userAttentionRequired',
                description: 'Claude requests user permission'
            },
            {
                name: 'question-prompt',
                pattern: /\?(\s*$|\s*\n)/,
                eventType: 'userAttentionRequired',
                description: 'Claude asks a question'
            },
            {
                name: 'y-n-confirmation',
                pattern: /\b(y\/n|yes\/no)\b/i,
                eventType: 'userAttentionRequired',
                description: 'Claude requests y/n confirmation'
            },
            {
                name: 'confirmation-prompt',
                pattern: /\b(continue\?|proceed\?|allow\?|confirm\?)\b/i,
                eventType: 'userAttentionRequired',
                description: 'Claude requests confirmation'
            },
            {
                name: 'user-input-needed',
                pattern: /(Waiting for|Need|Please provide) (input|response|answer)/i,
                eventType: 'userAttentionRequired',
                description: 'Claude waits for user input'
            },
            {
                name: 'sure-confirmation',
                pattern: /\b(are you sure|is this ok|do you want to)\b/i,
                eventType: 'userAttentionRequired',
                description: 'Claude requests sure confirmation'
            },

            // Claude Idle Patterns
            {
                name: 'ready-prompt',
                pattern: /(I'm ready|How can I help|What would you like|Ready to assist)/i,
                eventType: 'claudeIdle',
                description: 'Claude is ready for next instruction'
            },
            {
                name: 'conversation-end',
                pattern: /(Anything else|Is there anything|Need anything else)/i,
                eventType: 'claudeIdle',
                description: 'Claude finishes current task'
            }
        ];
    }

    private setupOutputChannelListeners(): void {
        // Monitor integrated terminal output - requires VS Code 1.74+ and API proposal
        if ('onDidWriteTerminalData' in vscode.window) {
            // @ts-ignore - API exists at runtime but not in types
            this.disposables.push(
                (vscode.window as any).onDidWriteTerminalData((e: any) => {
                    this.analyzeOutput(e.data.toString(), 'terminal', e.terminal.name);
                })
            );
        } else {
            console.warn('VS Code version does not support terminal output monitoring');
        }

        // Monitor output channels (for Claude Code extension output)
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (editor && this.isClaudeOutputFile(editor.document.fileName)) {
                    this.monitorDocument(editor.document);
                }
            })
        );

        // Check for existing Claude output files
        vscode.workspace.textDocuments.forEach(doc => {
            if (this.isClaudeOutputFile(doc.fileName)) {
                this.monitorDocument(doc);
            }
        });
    }

    private isClaudeOutputFile(fileName: string): boolean {
        const claudeOutputPatterns = [
            /claude/i,
            /anthropic/i,
            /claude-code/i
        ];

        return claudeOutputPatterns.some(pattern => pattern.test(fileName));
    }

    private monitorDocument(document: vscode.TextDocument): void {
        // Monitor document changes for Claude output
        const disposable = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document === document) {
                e.contentChanges.forEach(change => {
                    this.analyzeOutput(change.text, 'document', document.fileName);
                });
            }
        });

        this.disposables.push(disposable);
    }

    private analyzeOutput(text: string, source: string, sourceName: string): void {
        for (const pattern of this.patterns) {
            const matches = text.match(pattern.pattern);
            if (matches) {
                claudeEventBus.emit({
                    type: pattern.eventType,
                    timestamp: new Date(),
                    source: `${source}:${sourceName}`,
                    details: {
                        patternName: pattern.name,
                        pattern: pattern.pattern.source,
                        matchedText: matches[0],
                        fullText: text.trim(),
                        description: pattern.description
                    }
                });
            }
        }
    }

    public addCustomPattern(pattern: OutputPattern): void {
        this.patterns.push(pattern);
    }

    public removePattern(name: string): boolean {
        const index = this.patterns.findIndex(p => p.name === name);
        if (index > -1) {
            this.patterns.splice(index, 1);
            return true;
        }
        return false;
    }

    public getPatterns(): OutputPattern[] {
        return [...this.patterns];
    }

    public dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}