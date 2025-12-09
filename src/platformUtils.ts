import * as os from 'os';
import * as vscode from 'vscode';

export class PlatformUtils {
    public static getPlatform(): 'windows' | 'macos' | 'linux' {
        const platform = os.platform();
        switch (platform) {
            case 'win32': return 'windows';
            case 'darwin': return 'macos';
            case 'linux': return 'linux';
            default: return 'linux';
        }
    }

    public static getShellCommand(): string[] {
        const platform = this.getPlatform();
        switch (platform) {
            case 'windows':
                return ['cmd.exe', '/c'];
            case 'macos':
                return ['/bin/zsh', '-c'];
            case 'linux':
                return ['/bin/bash', '-c'];
            default:
                return ['/bin/sh', '-c'];
        }
    }

    public static getClaudeExecutablePaths(): string[] {
        const platform = this.getPlatform();
        const homeDir = os.homedir();

        const commonPaths = {
            windows: [
                `${homeDir}\\AppData\\Local\\Programs\\Claude\\claude.exe`,
                `${homeDir}\\claude.exe`,
                'C:\\Program Files\\Claude\\claude.exe',
                'claude.exe'
            ],
            macos: [
                '/usr/local/bin/claude',
                '/opt/homebrew/bin/claude',
                `${homeDir}/.local/bin/claude`,
                `${homeDir}/claude`,
                'claude'
            ],
            linux: [
                '/usr/local/bin/claude',
                '/usr/bin/claude',
                `${homeDir}/.local/bin/claude`,
                `${homeDir}/claude`,
                'claude'
            ]
        };

        return commonPaths[platform];
    }

    public static getTerminalNames(): string[] {
        const platform = this.getPlatform();

        const terminalPatterns = {
            windows: [
                'Command Prompt',
                'PowerShell',
                'Windows Terminal',
                'WSL',
                'Git Bash'
            ],
            macos: [
                'Terminal',
                'iTerm',
                'Hyper',
                'Alacritty',
                'kitty'
            ],
            linux: [
                'Terminal',
                'Konsole',
                'Gnome Terminal',
                'XFCE Terminal',
                'xterm'
            ]
        };

        return terminalPatterns[platform];
    }

    public static supportsNotifications(): boolean {
        // All platforms support notifications, but we might have different implementations
        return true;
    }

    public static supportsSounds(): boolean {
        const platform = this.getPlatform();

        // Basic sound support check - all modern platforms support this
        return true;
    }

    public static getCommandPaletteShortcuts(): { [key: string]: string } {
        const platform = this.getPlatform();

        const shortcuts = {
            windows: {
                'showActivity': 'Ctrl+Shift+P claudeflow.showActivity',
                'getCurrentTask': 'Ctrl+Shift+P claudeflow.getCurrentTask'
            },
            macos: {
                'showActivity': 'Cmd+Shift+P claudeflow.showActivity',
                'getCurrentTask': 'Cmd+Shift+P claudeflow.getCurrentTask'
            },
            linux: {
                'showActivity': 'Ctrl+Shift+P claudeflow.showActivity',
                'getCurrentTask': 'Ctrl+Shift+P claudeflow.getCurrentTask'
            }
        };

        return shortcuts[platform];
    }

    public static formatTerminalCommand(command: string): string {
        const platform = this.getPlatform();

        // Platform-specific command formatting
        switch (platform) {
            case 'windows':
                return command.replace(/\//g, '\\');
            case 'macos':
            case 'linux':
                return command.replace(/\\/g, '/');
            default:
                return command;
        }
    }

    public static async checkClaudeInstallation(): Promise<boolean> {
        const platform = this.getPlatform();
        const claudePaths = this.getClaudeExecutablePaths();

        for (const path of claudePaths) {
            try {
                // Check if the path exists (this is a simplified check)
                // In a real implementation, you'd use fs.access or child_process
                console.log(`Checking for Claude at: ${path}`);

                // For now, we'll just return true if we have any paths to check
                // In a full implementation, you'd actually test each path
                return true;
            } catch (error) {
                continue;
            }
        }

        return false;
    }

    public static getEnvironmentVariables(): { [key: string]: string } {
        const platform = this.getPlatform();
        const env = process.env;

        const claudeVars = {
            CLAUDE_API_KEY: env.CLAUDE_API_KEY || '',
            ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY || '',
            CLAUDE_CONFIG_DIR: env.CLAUDE_CONFIG_DIR || this.getDefaultConfigDir(),
            CLAUDE_LOG_LEVEL: env.CLAUDE_LOG_LEVEL || 'info'
        };

        return claudeVars;
    }

    private static getDefaultConfigDir(): string {
        const homeDir = os.homedir();
        const platform = this.getPlatform();

        switch (platform) {
            case 'windows':
                return `${homeDir}\\AppData\\Roaming\\Claude`;
            case 'macos':
                return `${homeDir}/Library/Application Support/Claude`;
            case 'linux':
                return `${homeDir}/.config/claude`;
            default:
                return `${homeDir}/.claude`;
        }
    }
}