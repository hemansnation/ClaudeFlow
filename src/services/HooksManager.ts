import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ClaudeEvent, ClaudeEventType } from './ClaudeActivityDetector';

type HookHandler = (event: ClaudeEvent) => void;

export class HooksManager {
  private watcher?: fs.FSWatcher;
  private handlers: HookHandler[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(private filePath: string) {}

  start() {
    if (!this.filePath) return;

    // Resolve relative paths against workspace root
    if (this.filePath && !path.isAbsolute(this.filePath)) {
      const workspaceRoot = vscode.workspace.rootPath;
      if (workspaceRoot) {
        this.filePath = path.join(workspaceRoot, this.filePath);
      }
    }

    // Check if file exists before watching
    if (!fs.existsSync(this.filePath)) {
      console.log(`Hooks file does not exist: ${this.filePath}`);
      return;
    }

    // Watch for file changes
    this.watcher = fs.watch(this.filePath, (eventType) => {
      if (eventType === 'change') {
        this.readFile();
      }
    });

    // Also watch for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('claudeflow.hooks')) {
          this.restart();
        }
      })
    );

    // Read initial file content
    this.readFile();
  }

  onEvent(handler: HookHandler) {
    this.handlers.push(handler);
  }

  private readFile() {
    fs.readFile(this.filePath, 'utf8', (err, data) => {
      if (err) return;

      const lines = data.split('\n').filter(Boolean);
      const last = lines[lines.length - 1];

      try {
        const parsed = JSON.parse(last);
        const evtType = this.mapType(parsed.type);
        if (!evtType) return;

        const evt: ClaudeEvent = {
          type: evtType,
          timestamp: Date.now(),
          raw: parsed.message ?? ''
        };

        this.handlers.forEach(h => h(evt));
      } catch (e) {
        // ignore malformed lines
        console.warn('Malformed hook event:', last, e);
      }
    });
  }

  private mapType(type: string): ClaudeEventType | null {
    if (type === 'task_started') return 'TaskStarted';
    if (type === 'task_completed') return 'TaskCompleted';
    if (type === 'attention_required') return 'AttentionRequired';
    return null;
  }

  private restart() {
    this.stop();
    const config = vscode.workspace.getConfiguration('claudeflow');
    const enabled = config.get<boolean>('hooks.enabled', false);
    const filePath = config.get<string>('hooks.filePath', '');

    if (enabled && filePath) {
      this.filePath = filePath;
      this.start();
    }
  }

  stop() {
    this.watcher?.close();
    this.watcher = undefined;
  }

  dispose() {
    this.stop();
    this.disposables.forEach(d => d.dispose());
    this.handlers = [];
  }
}