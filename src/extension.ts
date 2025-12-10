import * as vscode from 'vscode';
import { SoundPlayer } from './services/SoundPlayer';

let soundPlayer: SoundPlayer;

export function activate(context: vscode.ExtensionContext) {
    console.log('ClaudeFlow Extension is activating...');

    // Initialize SoundPlayer
    soundPlayer = new SoundPlayer(context);

    // Test sound command
    const testCommand = vscode.commands.registerCommand('claudeflow.testNotification', async () => {
        try {
            await soundPlayer.testSound();
            vscode.window.showInformationMessage('ClaudeFlow: Test sound played successfully!');
            console.log('ClaudeFlow testNotification executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`ClaudeFlow: Sound test failed: ${error}`);
            console.error('ClaudeFlow testNotification failed:', error);
        }
    });

    // Enable notifications command
    const enableCommand = vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
        const config = vscode.workspace.getConfiguration('claudeflow');
        config.update('enableSounds', true, vscode.ConfigurationTarget.Global);
        soundPlayer.setEnabled(true);
        vscode.window.showInformationMessage('ClaudeFlow: Notifications enabled!');
        console.log('ClaudeFlow enableNotifications executed');
    });

    // Disable notifications command
    const disableCommand = vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
        const config = vscode.workspace.getConfiguration('claudeflow');
        config.update('enableSounds', false, vscode.ConfigurationTarget.Global);
        soundPlayer.setEnabled(false);
        vscode.window.showInformationMessage('ClaudeFlow: Notifications disabled!');
        console.log('ClaudeFlow disableNotifications executed');
    });

    // Focus Claude command
    const focusCommand = vscode.commands.registerCommand('claudeflow.focusClaude', async () => {
        try {
            await soundPlayer.playAttentionRequired();
            vscode.window.showInformationMessage('ClaudeFlow: Focus Claude - Attention sound played');
            console.log('ClaudeFlow focusClaude executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`ClaudeFlow: Focus sound failed: ${error}`);
            console.error('ClaudeFlow focusClaude failed:', error);
        }
    });

    // Task complete simulation command
    const taskCompleteCommand = vscode.commands.registerCommand('claudeflow.taskComplete', async () => {
        try {
            await soundPlayer.playTaskComplete();
            vscode.window.showInformationMessage('ClaudeFlow: Task completed successfully!');
            console.log('ClaudeFlow taskComplete executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`ClaudeFlow: Task complete sound failed: ${error}`);
            console.error('ClaudeFlow taskComplete failed:', error);
        }
    });

    // Task start simulation command
    const taskStartCommand = vscode.commands.registerCommand('claudeflow.taskStart', () => {
        vscode.window.showInformationMessage('ClaudeFlow: Task started');
        console.log('ClaudeFlow taskStart executed');
    });

    // Test attention required command
    const testAttentionCommand = vscode.commands.registerCommand('claudeflow.testAttention', async () => {
        try {
            await soundPlayer.playAttentionRequired();
            vscode.window.showWarningMessage('ClaudeFlow: Attention required sound played!');
            console.log('ClaudeFlow testAttention executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`ClaudeFlow: Attention sound failed: ${error}`);
            console.error('ClaudeFlow testAttention failed:', error);
        }
    });

    // Test activity detection command
    const testActivityCommand = vscode.commands.registerCommand('claudeflow.testActivity', async () => {
        try {
            // Play task complete sound
            await soundPlayer.playTaskComplete();
            vscode.window.showInformationMessage('ClaudeFlow: Activity detection test - Task complete sound played');
            console.log('ClaudeFlow testActivity executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`ClaudeFlow: Activity test sound failed: ${error}`);
            console.error('ClaudeFlow testActivity failed:', error);
        }
    });

    // Configuration change listener
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('claudeflow.enableSounds')) {
            const config = vscode.workspace.getConfiguration('claudeflow');
            soundPlayer.setEnabled(config.get('enableSounds', true));
            console.log('ClaudeFlow: Sound configuration updated');
        }
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
        testActivityCommand,
        configChangeListener
    );

    console.log('ClaudeFlow Extension activated successfully!');
    vscode.window.showInformationMessage('ClaudeFlow Extension Loaded with sound support!');
}

export function deactivate() {
    console.log('ClaudeFlow Extension deactivated');
}