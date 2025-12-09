import * as vscode from 'vscode';
import { ClaudeEvent } from '../services/ClaudeActivityDetector';

export class StatusBarController {
  private item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.text = 'Claude: Idle';
    this.item.tooltip = 'ClaudeFlow status';
    this.item.show();
  }

  handleEvent(evt: ClaudeEvent) {
    if (evt.type === 'TaskStarted') {
      this.item.text = 'Claude: Working…';
    } else if (evt.type === 'TaskCompleted') {
      this.item.text = 'Claude: Idle';
    } else if (evt.type === 'AttentionRequired') {
      this.item.text = 'Claude: Waiting for you';
      this.item.command = 'claudeflow.focusClaude'; // optional command
    }
  }

  dispose() {
    this.item.dispose();
  }
}