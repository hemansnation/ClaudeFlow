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
            await soundPlayer.playNotification();
            vscode.window.showInformationMessage('🔔 ClaudeFlow: Sound check complete!');
            console.log('ClaudeFlow testNotification executed with notification sound');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Sound failed - ${error}`);
            console.error('ClaudeFlow testNotification failed:', error);
        }
    });

    // Enable notifications command
    const enableCommand = vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
        const config = vscode.workspace.getConfiguration('claudeflow');
        config.update('enableSounds', true, vscode.ConfigurationTarget.Global);
        config.update('enableDesktopNotifications', true, vscode.ConfigurationTarget.Global);
        soundPlayer.setEnabled(true);
        vscode.window.showInformationMessage('✅ ClaudeFlow: Notifications activated!');
        console.log('ClaudeFlow enableNotifications executed');
    });

    // Disable notifications command
    const disableCommand = vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
        const config = vscode.workspace.getConfiguration('claudeflow');
        config.update('enableSounds', false, vscode.ConfigurationTarget.Global);
        config.update('enableDesktopNotifications', false, vscode.ConfigurationTarget.Global);
        soundPlayer.setEnabled(false);
        vscode.window.showInformationMessage('🔇 ClaudeFlow: Silent mode on');
        console.log('ClaudeFlow disableNotifications executed');
    });

    // Focus Claude command
    const focusCommand = vscode.commands.registerCommand('claudeflow.focusClaude', async () => {
        try {
            await soundPlayer.playAttentionRequired();
            vscode.window.showInformationMessage('👀 ClaudeFlow: Claude needs you!');
            console.log('ClaudeFlow focusClaude executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Focus failed - ${error}`);
            console.error('ClaudeFlow focusClaude failed:', error);
        }
    });

    // Task complete simulation command
    const taskCompleteCommand = vscode.commands.registerCommand('claudeflow.taskComplete', async () => {
        try {
            await soundPlayer.playTaskComplete();
            vscode.window.showInformationMessage('🎉 ClaudeFlow: Boom! Task crushed it!');
            console.log('ClaudeFlow taskComplete executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Task sound failed - ${error}`);
            console.error('ClaudeFlow taskComplete failed:', error);
        }
    });

    // Task start simulation command
    const taskStartCommand = vscode.commands.registerCommand('claudeflow.taskStart', () => {
        vscode.window.showInformationMessage('🚀 ClaudeFlow: Claude is on it!');
        console.log('ClaudeFlow taskStart executed');
    });

    // Test attention required command
    const testAttentionCommand = vscode.commands.registerCommand('claudeflow.testAttention', async () => {
        try {
            await soundPlayer.playAttentionRequired();
            vscode.window.showWarningMessage('⚡ ClaudeFlow: Pay attention! Claude needs input');
            console.log('ClaudeFlow testAttention executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Attention sound failed - ${error}`);
            console.error('ClaudeFlow testAttention failed:', error);
        }
    });

    // Test activity detection command
    const testActivityCommand = vscode.commands.registerCommand('claudeflow.testActivity', async () => {
        try {
            // Play task complete sound
            await soundPlayer.playTaskComplete();
            vscode.window.showInformationMessage('🎯 ClaudeFlow: Activity detected! Claude just finished something');
            console.log('ClaudeFlow testActivity executed with sound');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Activity test failed - ${error}`);
            console.error('ClaudeFlow testActivity failed:', error);
        }
    });

    // Test error sound command
    const testErrorCommand = vscode.commands.registerCommand('claudeflow.testError', async () => {
        try {
            await soundPlayer.playError();
            vscode.window.showErrorMessage('💥 ClaudeFlow: Error sound test!');
            console.log('ClaudeFlow testError executed with error sound');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Error sound failed - ${error}`);
            console.error('ClaudeFlow testError failed:', error);
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
        testErrorCommand,
        configChangeListener
    );

    console.log('ClaudeFlow Extension activated successfully!');
    vscode.window.showInformationMessage('🔥 ClaudeFlow: Ready to rock! All systems online');
}

export function deactivate() {
    console.log('ClaudeFlow Extension deactivated');
}