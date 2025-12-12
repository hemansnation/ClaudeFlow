import * as vscode from 'vscode';
import { SoundPlayer } from './services/SoundPlayer';
import { TerminalDetector } from './terminalDetector';
import { OutputPatternDetector } from './outputPatternDetector';
import { claudeEventBus } from './eventBus';

let soundPlayer: SoundPlayer;
let terminalDetector: TerminalDetector;
let outputPatternDetector: OutputPatternDetector;

export function activate(context: vscode.ExtensionContext) {
    // Initialize services
    soundPlayer = new SoundPlayer(context);
    terminalDetector = new TerminalDetector();
    // Output pattern detector disabled for production (requires API proposal)

    // Set up event listeners for Claude activity detection
    claudeEventBus.on('taskStarted', (event) => {
        if (event.details?.reason === 'claude_command_detected' || event.details?.reason === 'claude_terminal_name') {
            playStartupSound();
        }
    });

    claudeEventBus.on('taskCompleted', (event) => {
        if (event.details?.reason === 'claude_exit_detected') {
            playExitSound();
        }
    });

    claudeEventBus.on('userAttentionRequired', (event) => {
        playPermissionSound();
    });


    // Test sound command
    const testSoundCommand = vscode.commands.registerCommand('claudeflow.testSound', async () => {
        try {
            await soundPlayer.playNotification();
            vscode.window.showInformationMessage('ClaudeFlow: Test sound played successfully!');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`ClaudeFlow: Sound test failed - ${errorMessage}`);
        }
    });

    // Register disposables
    const disposeables = [
        terminalDetector,
        testSoundCommand
    ];

    context.subscriptions.push(...disposeables);

}

function playDetectionSound() {
    if (soundPlayer && soundPlayer.isEnabled()) {
        soundPlayer.playNotification().catch(error => {
            console.error('Failed to play detection sound:', error);
        });
    }
}

function playStartupSound() {
    if (soundPlayer && soundPlayer.isEnabled()) {
        soundPlayer.playTaskComplete().catch(error => {
            console.error('Failed to play startup sound:', error);
        });
    }
}

function playExitSound() {
    if (soundPlayer && soundPlayer.isEnabled()) {
        soundPlayer.playAttentionRequired().catch(error => {
            console.error('Failed to play exit sound:', error);
        });
    }
}

function playPermissionSound() {
    if (soundPlayer && soundPlayer.isEnabled()) {
        soundPlayer.playPermission().catch(error => {
            console.error('Failed to play permission sound:', error);
        });
    }
}

export function deactivate() {
    // Extension deactivation
}