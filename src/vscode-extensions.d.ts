import * as vscode from 'vscode';

declare module 'vscode' {
    interface Window {
        onDidWriteTerminalData: (listener: (e: { terminal: Terminal; data: string }) => void) => Disposable;
    }
}