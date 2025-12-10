import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('ClaudeFlow Extension is activating...');

    // Simple test command first
    const testCommand = vscode.commands.registerCommand('claudeflow.testNotification', () => {
        vscode.window.showInformationMessage('ClaudeFlow Test Command Working!');
        console.log('ClaudeFlow test command executed');
    });

    context.subscriptions.push(testCommand);

    console.log('ClaudeFlow Extension activated successfully!');
    vscode.window.showInformationMessage('ClaudeFlow Extension Loaded!');
}

export function deactivate() {
    console.log('ClaudeFlow Extension deactivated');
}