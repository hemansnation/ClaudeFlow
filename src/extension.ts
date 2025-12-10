import * as vscode from 'vscode';
import { SoundPlayer } from './services/SoundPlayer';
import { NotificationManager } from './services/NotificationManager';
import { ClaudeActivityDetector, ClaudeEvent } from './services/ClaudeActivityDetector';

let soundPlayer: SoundPlayer;
let notificationManager: NotificationManager;
let activityDetector: ClaudeActivityDetector;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    console.log('ClaudeFlow Extension is activating...');

    // Initialize services
    soundPlayer = new SoundPlayer(context);
    notificationManager = new NotificationManager(soundPlayer);
    activityDetector = new ClaudeActivityDetector();

    // Set up automatic Claude activity detection
    activityDetector.onEvent(async (event: ClaudeEvent) => {
        console.log(`ClaudeFlow: Detected event - ${event.type}: ${event.raw}`);

        switch (event.type) {
            case 'TaskCompleted':
                await notificationManager.onTaskCompleted('Claude completed a task');
                break;
            case 'AttentionRequired':
                await notificationManager.onAttentionRequired('Claude needs your attention');
                break;
            case 'TaskStarted':
                // Optional: Handle task start if needed
                console.log('ClaudeFlow: Task started detected');
                break;
        }
    });

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = '$(claudeflow-icon) Claude: Active';
    statusBarItem.tooltip = 'ClaudeFlow Status - Click for options';
    statusBarItem.command = 'claudeflow.focusClaude';
    statusBarItem.show();

    // Test sound command
    const testSoundCommand = vscode.commands.registerCommand('claudeflow.testNotification', async () => {
        try {
            await soundPlayer.testSound();
            console.log('ClaudeFlow: Sound test successful');
        } catch (error) {
            console.error('ClaudeFlow: Sound test failed', error);
            vscode.window.showErrorMessage(`Sound test failed: ${error}`);
        }
    });

    // Enable notifications command
    const enableCommand = vscode.commands.registerCommand('claudeflow.enableNotifications', () => {
        const config = vscode.workspace.getConfiguration('claudeflow');
        config.update('enableSounds', true, vscode.ConfigurationTarget.Global);
        config.update('enableDesktopNotifications', true, vscode.ConfigurationTarget.Global);
        soundPlayer.setEnabled(true);
        vscode.window.showInformationMessage('ClaudeFlow notifications enabled!');
        console.log('ClaudeFlow: Notifications enabled');
    });

    // Disable notifications command
    const disableCommand = vscode.commands.registerCommand('claudeflow.disableNotifications', () => {
        const config = vscode.workspace.getConfiguration('claudeflow');
        config.update('enableSounds', false, vscode.ConfigurationTarget.Global);
        config.update('enableDesktopNotifications', false, vscode.ConfigurationTarget.Global);
        soundPlayer.setEnabled(false);
        vscode.window.showInformationMessage('ClaudeFlow notifications disabled!');
        console.log('ClaudeFlow: Notifications disabled');
    });

    // Focus Claude command
    const focusCommand = vscode.commands.registerCommand('claudeflow.focusClaude', async () => {
        await notificationManager.onAttentionRequired('Manual request');
    });

    // Task complete simulation command
    const taskCompleteCommand = vscode.commands.registerCommand('claudeflow.taskComplete', async () => {
        await notificationManager.onTaskCompleted('Test task completed successfully');
    });

    // Test attention required command
    const testAttentionCommand = vscode.commands.registerCommand('claudeflow.testAttention', async () => {
        await notificationManager.onAttentionRequired('Test attention required');
    });

    // Manual task start simulation
    const taskStartCommand = vscode.commands.registerCommand('claudeflow.taskStart', () => {
        const event: ClaudeEvent = {
            type: 'TaskStarted',
            timestamp: Date.now(),
            raw: 'Manual task start test'
        };
        activityDetector.emit(event);
    });

    // Manual activity detector test
    const testActivityCommand = vscode.commands.registerCommand('claudeflow.testActivity', () => {
        const events: ClaudeEvent[] = [
            { type: 'TaskStarted', timestamp: Date.now(), raw: 'I will help you with this task' },
            { type: 'TaskCompleted', timestamp: Date.now(), raw: 'Task completed successfully' },
            { type: 'AttentionRequired', timestamp: Date.now(), raw: 'Please confirm if you want me to continue' }
        ];

        events.forEach(event => activityDetector.emit(event));
        vscode.window.showInformationMessage('ClaudeFlow: Activity simulation test completed');
    });

    // Configuration change listener
    const configChangeListener = vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('claudeflow.enableSounds')) {
            const config = vscode.workspace.getConfiguration('claudeflow');
            soundPlayer.setEnabled(config.get('enableSounds', true));
        }
    });

    // Add all disposables
    context.subscriptions.push(
        statusBarItem,
        testSoundCommand,
        enableCommand,
        disableCommand,
        focusCommand,
        taskCompleteCommand,
        taskStartCommand,
        testAttentionCommand,
        testActivityCommand,
        configChangeListener,
        activityDetector
    );

    console.log('ClaudeFlow Extension activated successfully!');
    vscode.window.showInformationMessage('ClaudeFlow Extension Loaded with all features!');
}

export function deactivate() {
    console.log('ClaudeFlow Simple Extension deactivated');
}