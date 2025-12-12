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

  async playNotification(): Promise<void> {
    if (!this.enabled) return;
    await this.playOSSound('notification');
  }

  async playError(): Promise<void> {
    if (!this.enabled) return;
    await this.playOSSound('error');
  }

  async playWarning(): Promise<void> {
    if (!this.enabled) return;
    await this.playOSSound('warning');
  }

  async playPermission(): Promise<void> {
    if (!this.enabled) return;
    // Use a more noticeable sound for permission requests
    await this.playMacOSSpecific('/System/Library/Sounds/Glass.aiff');
  }

  private async playMacOSSpecific(soundFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const command = `/usr/bin/afplay "${soundFile}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.playSystemBeep().then(resolve).catch(reject);
        } else {
          resolve();
        }
      });
    });
  }

  private async playOSSound(kind: 'taskComplete' | 'attentionRequired' | 'notification' | 'error' | 'warning') {
    const config = vscode.workspace.getConfiguration('claudeflow');

    // Use specific sound keys for different events
    let soundKey: string;
    switch (kind) {
      case 'taskComplete':
        soundKey = 'taskComplete';
        break;
      case 'attentionRequired':
        soundKey = 'attentionRequired';
        break;
      case 'notification':
        soundKey = config.get<string>('taskCompleteSound', 'default');
        break;
      case 'error':
        soundKey = 'error';
        break;
      case 'warning':
        soundKey = 'warning';
        break;
      default:
        soundKey = 'default';
    }

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
        'ding': '/System/Library/Sounds/Ping.aiff',
        'chime': '/System/Library/Sounds/Hero.aiff',
        'bell': '/System/Library/Sounds/Tink.aiff'
      };

      // Different sounds for different events
      const eventSounds: { [key: string]: string } = {
        'taskComplete': '/System/Library/Sounds/Hero.aiff',      // Success sound
        'attentionRequired': '/System/Library/Sounds/Ping.aiff', // Attention sound
        'notification': '/System/Library/Sounds/Glass.aiff',      // General notification
        'error': '/System/Library/Sounds/Basso.aiff',            // Error sound
        'warning': '/System/Library/Sounds/Morse.aiff',          // Warning sound
      };

      let soundFile = eventSounds[soundKey] || soundFiles[soundKey as SoundType] || soundFiles['default'];

      const command = `/usr/bin/afplay "${soundFile}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.playSystemBeep().then(resolve).catch(reject);
        } else {
          resolve();
        }
      });
    });
  }

  private async playSystemBeep(): Promise<void> {
    return new Promise((resolve) => {
      exec('/usr/bin/afplay /System/Library/Sounds/Ping.aiff', (error) => {
        resolve(); // Always resolve to avoid hanging
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