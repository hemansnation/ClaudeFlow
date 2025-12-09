import * as vscode from 'vscode';
import { SoundPlayer } from './services/SoundPlayer';
import { NotificationManager } from './services/NotificationManager';
import { ClaudeActivityDetector, ClaudeEvent } from './services/ClaudeActivityDetector';
import { EventHistory } from './services/SimpleEventHistory';
import { StatusBarController } from './ui/StatusBarController';
import { HooksManager } from './services/HooksManager';

let statusBar: StatusBarController;

export function activate(context: vscode.ExtensionContext) {
  const soundPlayer = new SoundPlayer(context);
  const notificationManager = new NotificationManager(soundPlayer);
  const eventHistory = new EventHistory();
  const detector = new ClaudeActivityDetector();
  statusBar = new StatusBarController();

  // Wire events
  const handleClaudeEvent = (evt: ClaudeEvent) => {
    eventHistory.addEvent(evt);
    statusBar.handleEvent(evt);

    if (evt.type === 'TaskCompleted') {
      notificationManager.onTaskCompleted();
    } else if (evt.type === 'AttentionRequired') {
      notificationManager.onAttentionRequired();
    }
  };

  detector.onEvent(handleClaudeEvent);

        // Optional hooks
  const config = vscode.workspace.getConfiguration('claudeflow');
  if (config.get<boolean>('hooks.enabled', false)) {
    const filePath = config.get<string>('hooks.filePath', '');
    if (filePath) {
      const hooksManager = new HooksManager(filePath);
      hooksManager.onEvent(handleClaudeEvent);
      hooksManager.start();
      context.subscriptions.push({ dispose: () => hooksManager.stop() });
    }
  }

  // Commands for enabling/disabling/test notifications
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
      vscode.workspace
        .getConfiguration('claudeflow')
        .update('enableDesktopNotifications', true, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('ClaudeFlow notifications enabled.');
    }),
    vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
      vscode.workspace
        .getConfiguration('claudeflow')
        .update('enableDesktopNotifications', false, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('ClaudeFlow notifications disabled.');
    }),
    vscode.commands.registerCommand('claudeflow.testNotification', async () => {
      await notificationManager.onTaskCompleted('Test notification');
    })
  );

    try {
        console.log('ClaudeFlow successfully activated with all services wired!');
    } catch (error) {
        console.error('Error activating ClaudeFlow:', error);
        vscode.window.showErrorMessage(`ClaudeFlow activation failed: ${error}`);
    }
}

export function deactivate() {
    statusBar?.dispose();
}