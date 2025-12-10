import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ClaudeFlow Extension is activating...');

    // Test sound command
    const testCommand = vscode.commands.registerCommand('claudeflow.testNotification', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Test Command Working!');
        console.log('ClaudeFlow testNotification executed');
    });

    // Enable notifications command
    const enableCommand = vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Notifications enabled!');
        console.log('ClaudeFlow enableNotifications executed');
    });

    // Disable notifications command
    const disableCommand = vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Notifications disabled!');
        console.log('ClaudeFlow disableNotifications executed');
    });

    // Focus Claude command
    const focusCommand = vscode.commands.registerCommand('claudeflow.focusClaude', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Focus Claude feature');
        console.log('ClaudeFlow focusClaude executed');
    });

    // Task complete simulation command
    const taskCompleteCommand = vscode.commands.registerCommand('claudeflow.taskComplete', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Task completed successfully!');
        console.log('ClaudeFlow taskComplete executed');
    });

    // Task start simulation command
    const taskStartCommand = vscode.commands.registerCommand('claudeflow.taskStart', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Task started');
        console.log('ClaudeFlow taskStart executed');
    });

    // Test attention required command
    const testAttentionCommand = vscode.commands.registerCommand('claudeflow.testAttention', () => {
        vscode.window.showWarningMessage('ClaudeFlow: Attention required test');
        console.log('ClaudeFlow testAttention executed');
    });

    // Test activity detection command
    const testActivityCommand = vscode.commands.registerCommand('claudeflow.testActivity', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Activity detection test');
        console.log('ClaudeFlow testActivity executed');
    });

    // Register all commands
    context.subscriptions.push(
        testCommand,
        enableCommand,
        disableCommand,
        focusCommand,
        taskCompleteCommand,
        taskStartCommand,
        testAttentionCommand,
        testActivityCommand
    );

    console.log('ClaudeFlow Extension activated successfully!');
    vscode.window.showInformationMessage('ClaudeFlow Extension Loaded with all commands!');
}

export function deactivate() {
    console.log('ClaudeFlow Extension deactivated');
}