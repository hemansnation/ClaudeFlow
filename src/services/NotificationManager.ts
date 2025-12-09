import * as vscode from 'vscode';
import { SoundPlayer } from './SoundPlayer';

export class NotificationManager {
    constructor(private readonly sound: SoundPlayer) {
        // SoundPlayer is injected as per specification
    }

    async onTaskCompleted(taskSummary?: string) {
        const config = vscode.workspace.getConfiguration('claudeflow');

        if (config.get('enableSounds', true)) {
            await this.sound.playTaskComplete();
        }

        if (config.get('enableDesktopNotifications', true) &&
            config.get('showTaskCompletePopup', true)) {
            const msg = taskSummary
                ? `Claude completed: ${taskSummary}`
                : 'Claude has finished the current task.';
            vscode.window.showInformationMessage(msg);
        }
    }

    async onAttentionRequired(reason?: string) {
        const config = vscode.workspace.getConfiguration('claudeflow');

        if (config.get('enableSounds', true)) {
            await this.sound.playAttentionRequired();
        }

        if (config.get('enableDesktopNotifications', true) &&
            config.get('showAttentionPopup', true)) {
            const msg = reason
                ? `Claude needs your attention: ${reason}`
                : 'Claude is waiting for your input/permission.';
            vscode.window.showWarningMessage(msg, 'Go to Claude Panel').then(selection => {
                if (selection === 'Go to Claude Panel') {
                    // Optionally bring Claude view to front (if identifiable)
                    vscode.commands.executeCommand('claudeflow.showActivity');
                }
            });
        }
    }
}