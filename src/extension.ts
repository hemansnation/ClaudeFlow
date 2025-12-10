import * as vscode from 'vscode';
import { SoundPlayer } from './services/SoundPlayer';
import { ClaudeActivityDetector, ClaudeEvent } from './services/ClaudeActivityDetector';

let soundPlayer: SoundPlayer;
let activityDetector: ClaudeActivityDetector;

export function activate(context: vscode.ExtensionContext) {
    console.log('ClaudeFlow Extension is activating...');

    // Initialize services
    soundPlayer = new SoundPlayer(context);
    activityDetector = new ClaudeActivityDetector();

    // Set up automatic Claude activity detection
    activityDetector.onEvent(async (event: ClaudeEvent) => {
        console.log(`🎯 ClaudeFlow: EVENT RECEIVED - ${event.type}: ${event.raw}`);

        switch (event.type) {
            case 'TaskCompleted':
                console.log('🔊 ClaudeFlow: Playing task complete sound');
                try {
                    await soundPlayer.playTaskComplete();
                    vscode.window.showInformationMessage('🎉 ClaudeFlow: Claude completed a task!');
                    console.log('✅ ClaudeFlow: Task complete notification sent successfully');
                } catch (soundError) {
                    console.error('❌ ClaudeFlow: Sound playback failed:', soundError);
                    vscode.window.showErrorMessage(`❌ Sound failed: ${soundError}`);
                }
                break;
            case 'AttentionRequired':
                console.log('🔊 ClaudeFlow: Playing attention required sound');
                try {
                    await soundPlayer.playAttentionRequired();
                    vscode.window.showWarningMessage('⚡ ClaudeFlow: Claude needs your attention!');
                    console.log('✅ ClaudeFlow: Attention notification sent successfully');
                } catch (soundError) {
                    console.error('❌ ClaudeFlow: Attention sound failed:', soundError);
                    vscode.window.showErrorMessage(`❌ Attention sound failed: ${soundError}`);
                }
                break;
            case 'TaskStarted':
                console.log('📢 ClaudeFlow: Task started event');
                vscode.window.showInformationMessage('🚀 ClaudeFlow: Claude started a task');
                break;
        }
    });

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

    // Check Claude Code detection command
    const checkDetectionCommand = vscode.commands.registerCommand('claudeflow.checkDetection', () => {
        const terminals = vscode.window.terminals;
        const claudeTerminals = terminals.filter(t => {
            const name = t.name.toLowerCase();
            return name.includes('claude') || name.includes('claude code') || name.includes('claudeflow');
        });

        if (claudeTerminals.length > 0) {
            vscode.window.showInformationMessage(
                `🔍 ClaudeFlow: Found ${claudeTerminals.length} Claude terminal(s): ${claudeTerminals.map(t => t.name).join(', ')}`
            );
            console.log('ClaudeFlow: Claude terminals detected:', claudeTerminals.map(t => t.name));
        } else {
            vscode.window.showWarningMessage('🔍 ClaudeFlow: No Claude terminals detected. Open Claude Code to test automatic detection!');
            console.log('ClaudeFlow: No Claude terminals found');
        }

        // Check for log files
        const fs = require('fs');
        const logPaths = [
            `${process.env.HOME}/.claude/output.log`,
            `${process.env.HOME}/.config/claude/logs/claude.log`,
            '/tmp/claude-output.log'
        ];

        const foundLogs = logPaths.filter(path => {
            try {
                return fs.existsSync(path);
            } catch {
                return false;
            }
        });

        if (foundLogs.length > 0) {
            console.log('ClaudeFlow: Found Claude log files:', foundLogs);
            vscode.window.showInformationMessage(`📁 ClaudeFlow: Monitoring ${foundLogs.length} log file(s)`);
        } else {
            console.log('ClaudeFlow: No Claude log files found for monitoring');
            vscode.window.showWarningMessage('📁 ClaudeFlow: No Claude log files found - will use periodic monitoring');
        }
    });

    // Trigger activity detection manually
    const triggerActivityCommand = vscode.commands.registerCommand('claudeflow.triggerActivity', async () => {
        try {
            // Simulate Claude asking for permission
            const event: ClaudeEvent = {
                type: 'AttentionRequired',
                timestamp: Date.now(),
                raw: 'Would you like me to create a new file? [Y/n]'
            };

            activityDetector.emit(event);

            await soundPlayer.playAttentionRequired();
            vscode.window.showWarningMessage('⚡ ClaudeFlow: Simulated Claude permission request!');

            console.log('ClaudeFlow: Manual activity trigger - attention required');
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Activity trigger failed - ${error}`);
            console.error('ClaudeFlow triggerActivity failed:', error);
        }
    });

    // Create test file to trigger file-based detection
    const createTestFileCommand = vscode.commands.registerCommand('claudeflow.createTestFile', async () => {
        try {
            const fs = require('fs');
            const path = require('path');
            const testFilePath = path.join(process.env.HOME || '', '.claude', 'test-activity.txt');

            // Create directory if it doesn't exist
            const dir = path.dirname(testFilePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Write test content that matches Claude patterns
            const testContent = `Task completed successfully!\nAll done! Here's what I've created.\n${new Date().toISOString()}\n`;

            fs.writeFileSync(testFilePath, testContent);
            vscode.window.showInformationMessage('📝 ClaudeFlow: Test file created - should trigger detection!');
            console.log('ClaudeFlow: Test file created at:', testFilePath);
        } catch (error) {
            vscode.window.showErrorMessage(`❌ ClaudeFlow: Test file creation failed - ${error}`);
            console.error('ClaudeFlow createTestFile failed:', error);
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
        checkDetectionCommand,
        triggerActivityCommand,
        createTestFileCommand,
        configChangeListener
    );

    console.log('ClaudeFlow Extension activated successfully!');
    vscode.window.showInformationMessage('🔥 ClaudeFlow: Ready to rock! All systems online');
}

export function deactivate() {
    console.log('ClaudeFlow Extension deactivated');
}