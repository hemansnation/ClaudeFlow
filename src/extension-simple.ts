import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ClaudeFlow Simple Extension is activating...');

    // Simple test command
    const testCommand = vscode.commands.registerCommand('claudeflow.simpleTest', () => {
        vscode.window.showInformationMessage('ClaudeFlow Simple Test Works!');
        console.log('ClaudeFlow: Simple test command executed');
    });

    // Enable notifications command
    const enableCommand = vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
        vscode.window.showInformationMessage('ClaudeFlow notifications enabled!');
        console.log('ClaudeFlow: Notifications enabled');
    });

    // Disable notifications command
    const disableCommand = vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
        vscode.window.showInformationMessage('ClaudeFlow notifications disabled!');
        console.log('ClaudeFlow: Notifications disabled');
    });

    // Test notification command
    const testNotificationCommand = vscode.commands.registerCommand('claudeflow.testNotification', () => {
        vscode.window.showInformationMessage('ClaudeFlow test notification!');
        console.log('ClaudeFlow: Test notification sent');
    });

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = 'Claude: Active';
    statusBarItem.tooltip = 'ClaudeFlow Status';
    statusBarItem.show();

    // Add all disposables
    context.subscriptions.push(
        testCommand,
        enableCommand,
        disableCommand,
        testNotificationCommand,
        statusBarItem
    );

    console.log('ClaudeFlow Simple Extension activated successfully!');
    vscode.window.showInformationMessage('ClaudeFlow Simple Extension Loaded!');
}

export function deactivate() {
    console.log('ClaudeFlow Simple Extension deactivated');
}