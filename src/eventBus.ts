export interface ClaudeActivityEvent {
    type: 'taskStarted' | 'taskCompleted' | 'userAttentionRequired' | 'claudeIdle';
    timestamp: Date;
    source: string;
    details?: any;
}

export type EventListener = (event: ClaudeActivityEvent) => void;

export class ClaudeEventBus {
    private listeners: Map<string, EventListener[]> = new Map();

    on(eventType: string, listener: EventListener): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType)!.push(listener);
    }

    off(eventType: string, listener: EventListener): void {
        const currentListeners = this.listeners.get(eventType);
        if (currentListeners) {
            const index = currentListeners.indexOf(listener);
            if (index > -1) {
                currentListeners.splice(index, 1);
            }
        }
    }

    emit(event: ClaudeActivityEvent): void {
        const listeners = this.listeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(event);
                } catch (error) {
                    console.error('Error in event listener:', error);
                }
            });
        }
    }

    emitTaskStarted(source: string, details?: any): void {
        this.emit({
            type: 'taskStarted',
            timestamp: new Date(),
            source,
            details
        });
    }

    emitTaskCompleted(source: string, details?: any): void {
        this.emit({
            type: 'taskCompleted',
            timestamp: new Date(),
            source,
            details
        });
    }

    emitUserAttentionRequired(source: string, details?: any): void {
        this.emit({
            type: 'userAttentionRequired',
            timestamp: new Date(),
            source,
            details
        });
    }

    emitClaudeIdle(source: string, details?: any): void {
        this.emit({
            type: 'claudeIdle',
            timestamp: new Date(),
            source,
            details
        });
    }
}

export const claudeEventBus = new ClaudeEventBus();