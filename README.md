# ClaudeFlow

![ClaudeFlow Icon](resources/icon.png)

Smart notifications, permission handling, and complete control for Claude Code.

## Overview

ClaudeFlow is a VS Code extension that provides intelligent notifications and comprehensive control over your Claude Code workflow. It monitors Claude's activity and keeps you informed when tasks complete, attention is needed, or important events occur.

## Features

### Smart Notifications
- Real-time notifications when Claude completes tasks
- Attention alerts when Claude needs user input
- Configurable notification preferences
- Permission request tracking and history

### Cross-Platform Sound Support
- Native sound notifications on macOS, Windows, and Linux
- Multiple sound options: default, ding, chime, and bell
- Adjustable volume control (0.0 to 1.0)
- Option to disable sounds entirely

### Status Bar Integration
- Live status tracking in VS Code status bar
- Quick access to extension commands
- Visual indicators for Claude's current state

### Advanced Configuration
- File-based hooks integration
- Customizable history sizes for events, notifications, and permissions
- Flexible permission awareness settings

## Installation

### From VS Code Marketplace
1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for `ClaudeFlow` or `HimanshuRamchandani.claudeflow`
4. Click Install

**Direct Install**: [ClaudeFlow on VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=HimanshuRamchandani.claudeflow)

### Manual Installation
1. Download the latest VSIX file from the [Releases](https://github.com/hemansnation/ClaudeFlow/releases) page
2. Open VS Code
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
4. Type `Extensions: Install from VSIX`
5. Select the downloaded VSIX file

## Getting Started

After installation, ClaudeFlow automatically starts monitoring your Claude Code activity. Here's how to use it:

### Basic Usage
1. Start working with Claude Code in VS Code
2. ClaudeFlow will automatically detect and notify you of:
   - Task completion
   - Permission requests
   - Attention requirements
   - Status changes

### Available Commands
Access these commands through the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- `ClaudeFlow: Enable Notifications` - Turn on desktop notifications
- `ClaudeFlow: Disable Notifications` - Turn off desktop notifications
- `ClaudeFlow: Test Notification` - Send a test notification

### Status Bar
The ClaudeFlow status bar item shows:
- Current Claude activity status
- Quick access to enable/disable features
- Connection status to Claude Code

## Configuration

Customize ClaudeFlow through VS Code Settings. Search for "ClaudeFlow" or navigate to `Settings > Extensions > ClaudeFlow`.

### Notification Settings
- `claudeflow.enableDesktopNotifications` (boolean, default: true)
  - Enable desktop notifications for Claude events

- `claudeflow.showTaskCompletePopup` (boolean, default: true)
  - Show popup when Claude completes a task

- `claudeflow.showAttentionPopup` (boolean, default: true)
  - Show popup when Claude needs attention

### Sound Settings
- `claudeflow.enableSounds` (boolean, default: true)
  - Enable sound notifications

- `claudeflow.taskCompleteSound` (string, default: "default")
  - Sound for task completion: "default", "ding", "chime", or "bell"

- `claudeflow.attentionSound` (string, default: "default")
  - Sound for attention requests: "default", "ding", "chime", or "bell"

- `claudeflow.soundVolume` (number, default: 1.0)
  - Volume level from 0.0 (muted) to 1.0 (full volume)

### History Settings
- `claudeflow.permissionHistorySize` (number, default: 100)
  - Maximum permission requests to keep in history

- `claudeflow.notificationHistorySize` (number, default: 50)
  - Maximum notifications to keep in history

- `claudeflow.eventHistorySize` (number, default: 500)
  - Maximum events to keep in history

### Hooks Integration
- `claudeflow.hooks.enabled` (boolean, default: false)
  - Enable file-based Claude hooks detection

- `claudeflow.hooks.filePath` (string, default: "")
  - Path to Claude hooks JSON file (relative or absolute)

## Troubleshooting

### Common Issues

#### Notifications Not Appearing
1. Check if `claudeflow.enableDesktopNotifications` is enabled in settings
2. Verify system notification permissions for VS Code
3. Try the test notification command

#### Sounds Not Playing
1. Ensure `claudeflow.enableSounds` is enabled
2. Check system volume and sound settings
3. Verify sound volume is not set to 0.0
4. Test different sound options in settings

#### Extension Not Detecting Claude Activity
1. Make sure you're actively using Claude Code
2. Check that Claude Code is properly integrated with VS Code
3. Restart VS Code and try again

### Getting Help
- Report issues on our [GitHub Issues](https://github.com/hemansnation/ClaudeFlow/issues) page
- Check the [FAQ](https://github.com/hemansnation/ClaudeFlow/discussions) for common questions

## Development

### Prerequisites
- Node.js 20 or higher
- VS Code Extension Development Host
- TypeScript compiler

### Building from Source
1. Clone the repository:
   ```bash
   git clone https://github.com/hemansnation/ClaudeFlow.git
   cd ClaudeFlow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile TypeScript:
   ```bash
   npm run compile
   ```

4. Run in development mode:
   - Open VS Code
   - Press `F5` to launch Extension Development Host
   - Test the extension

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Changelog

### Version 1.0.1
- Added extension icon
- Improved package structure
- Enhanced marketplace visibility

### Version 1.0.0
- Initial release
- Smart notifications for Claude Code
- Cross-platform sound support
- Status bar integration
- Comprehensive configuration options

## Support ClaudeFlow Development

If you find ClaudeFlow useful, please consider:
- Rating the extension on the VS Code Marketplace
- Reporting bugs and feature requests
- Contributing to the project on GitHub
- Sharing with other Claude Code users

**Extension Page**: [ClaudeFlow on VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=HimanshuRamchandani.claudeflow)

---

*ClaudeFlow is not officially affiliated with Anthropic or Claude Code. It is an independent extension designed to enhance the Claude Code experience.*