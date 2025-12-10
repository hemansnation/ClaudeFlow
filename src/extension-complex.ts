import * as vscode from 'vscode';
import { SoundPlayer } from './services/SoundPlayer';
import { NotificationManager } from './services/NotificationManager';
import { ClaudeActivityDetector, ClaudeEvent } from './services/ClaudeActivityDetector';
import { EventHistory } from './services/SimpleEventHistory';
import { StatusBarController } from './ui/StatusBarController';
import { HooksManager } from './services/HooksManager';

let statusBar: StatusBarController;

export function activate(context: vscode.ExtensionContext) {
  console.log('ClaudeFlow extension is activating...');

  try {
    const soundPlayer = new SoundPlayer(context);
    const notificationManager = new NotificationManager(soundPlayer);
    const eventHistory = new EventHistory();
    const detector = new ClaudeActivityDetector();
    statusBar = new StatusBarController();

    console.log('ClaudeFlow: All services initialized successfully');

    // Wire events
    const handleClaudeEvent = (evt: ClaudeEvent) => {
      try {
        console.log('ClaudeFlow: Handling event:', evt.type);
        eventHistory.addEvent(evt);
        statusBar.handleEvent(evt);

        if (evt.type === 'TaskCompleted') {
          notificationManager.onTaskCompleted();
        } else if (evt.type === 'AttentionRequired') {
          notificationManager.onAttentionRequired();
        }
      } catch (error) {
        console.error('ClaudeFlow: Error handling event:', error);
      }
    };

    detector.onEvent(handleClaudeEvent);
    console.log('ClaudeFlow: Event detector wired successfully');

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
  const enableNotificationsCmd = vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
    try {
      vscode.workspace
        .getConfiguration('claudeflow')
        .update('enableDesktopNotifications', true, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('ClaudeFlow notifications enabled.');
      console.log('ClaudeFlow: Notifications enabled by user');
    } catch (error) {
      console.error('ClaudeFlow: Error enabling notifications:', error);
      vscode.window.showErrorMessage(`Failed to enable notifications: ${error}`);
    }
  });

  const disableNotificationsCmd = vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
    try {
      vscode.workspace
        .getConfiguration('claudeflow')
        .update('enableDesktopNotifications', false, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage('ClaudeFlow notifications disabled.');
      console.log('ClaudeFlow: Notifications disabled by user');
    } catch (error) {
      console.error('ClaudeFlow: Error disabling notifications:', error);
      vscode.window.showErrorMessage(`Failed to disable notifications: ${error}`);
    }
  });

  const testNotificationCmd = vscode.commands.registerCommand('claudeflow.testNotification', async () => {
    try {
      console.log('ClaudeFlow: Testing notification...');
      await notificationManager.onTaskCompleted('Test notification');
      vscode.window.showInformationMessage('ClaudeFlow test notification sent successfully!');
    } catch (error) {
      console.error('ClaudeFlow: Test notification failed:', error);
      vscode.window.showErrorMessage(`ClaudeFlow test failed: ${error}`);
    }
  });

  const focusClaudeCmd = vscode.commands.registerCommand('claudeflow.focusClaude', () => {
    try {
      vscode.window.showInformationMessage('Claude integration - Focus command not yet implemented');
    } catch (error) {
      console.error('ClaudeFlow: Focus Claude command failed:', error);
    }
  });

  context.subscriptions.push(
    enableNotificationsCmd,
    disableNotificationsCmd,
    testNotificationCmd,
    focusClaudeCmd
  );

  console.log('ClaudeFlow: All commands registered successfully');

    console.log('ClaudeFlow successfully activated with all services wired!');
  } catch (error) {
    console.error('Error activating ClaudeFlow:', error);
    vscode.window.showErrorMessage(`ClaudeFlow activation failed: ${error}`);
  }
}

export function deactivate() {
    statusBar?.dispose();
}