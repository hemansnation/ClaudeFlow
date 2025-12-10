import * as vscode from 'vscode';
import { exec } from 'child_process';

type SoundType = 'default' | 'ding' | 'chime' | 'bell';

export class SoundPlayer {
  private enabled: boolean = true;

  constructor(private readonly context: vscode.ExtensionContext) {
    // Initialize from configuration
    const config = vscode.workspace.getConfiguration('claudeflow');
    this.enabled = config.get<boolean>('enableSounds', true);
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  async playTaskComplete(): Promise<void> {
    if (!this.enabled) return;
    await this.playOSSound('taskComplete');
  }

  async playAttentionRequired(): Promise<void> {
    if (!this.enabled) return;
    await this.playOSSound('attentionRequired');
  }

  private async playOSSound(kind: 'taskComplete' | 'attentionRequired') {
    const config = vscode.workspace.getConfiguration('claudeflow');
    const soundKey =
      kind === 'taskComplete'
        ? config.get<string>('taskCompleteSound', 'default')
        : config.get<string>('attentionSound', 'default');

    // Implementation: choose per-OS strategy
    if (process.platform === 'darwin') {
      await this.playMacSound(soundKey);
    } else if (process.platform === 'win32') {
      await this.playWindowsSound(soundKey);
    } else {
      await this.playLinuxSound(soundKey);
    }
  }

  private playMacSound(soundKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const soundFiles: { [key in SoundType]: string } = {
        'default': '/System/Library/Sounds/Glass.aiff',
        'ding': '/System/Library/Sounds/Glass.aiff',
        'chime': '/System/Library/Sounds/Glass.aiff',
        'bell': '/System/Library/Sounds/Glass.aiff'
      };

      const file = soundFiles[soundKey as SoundType] || soundFiles['default'];
      exec(`afplay "${file}"`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private playWindowsSound(soundKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simple beep; can be enhanced later
      const ps = `Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SystemSounds]::Beep.Play()`;
      exec(`powershell -Command "${ps}"`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  private playLinuxSound(soundKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Try paplay, fallback to beep
      exec('paplay /usr/share/sounds/freedesktop/stereo/complete.oga', (err: any) => {
        if (err) {
          exec('beep', (error2: any) => {
            if (error2) {
              reject(error2);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Test sound playback with user feedback
   */
  public async testSound(soundType: 'taskComplete' | 'attentionRequired' = 'taskComplete'): Promise<void> {
    try {
      if (soundType === 'taskComplete') {
        await this.playTaskComplete();
      } else {
        await this.playAttentionRequired();
      }
      vscode.window.showInformationMessage(`✓ Sound test successful: ${soundType}`);
    } catch (error) {
      vscode.window.showErrorMessage(`✗ Sound test failed: ${error}`);
    }
  }

  /**
   * Check if sounds are enabled
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggle sound enabled state
   */
  public toggle(): void {
    this.enabled = !this.enabled;
  }
}