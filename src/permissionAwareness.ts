import * as vscode from 'vscode';
import { claudeEventBus, ClaudeActivityEvent } from './eventBus';

export interface PermissionRequest {
    id: string;
    type: 'file-access' | 'network-access' | 'system-command' | 'user-input' | 'confirmation' | 'unknown';
    source: string;
    description: string;
    details?: any;
    timestamp: Date;
    resolved: boolean;
    resolution?: 'approved' | 'denied' | 'timeout';
    timeout?: number; // milliseconds
}

export class PermissionAwareness {
    private activeRequests: Map<string, PermissionRequest> = new Map();
    private requestHistory: PermissionRequest[] = [];
    private maxHistorySize: number = 100;
    private disposables: vscode.Disposable[] = [];
    private checkInterval?: NodeJS.Timeout;

    constructor() {
        this.setupEventListeners();
        this.startMonitoring();
    }

    private setupEventListeners(): void {
        // Listen for permission-related events
        claudeEventBus.on('userAttentionRequired', (event: ClaudeActivityEvent) => {
            this.analyzePermissionRequest(event);
        });

        claudeEventBus.on('taskCompleted', (event: ClaudeActivityEvent) => {
            this.resolvePendingRequests(event.source, 'approved');
        });

        // Configuration changes
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('claudeflow.permissionHistorySize')) {
                    const config = vscode.workspace.getConfiguration('claudeflow');
                    this.maxHistorySize = config.get<number>('permissionHistorySize', 100);
                    this.trimHistory();
                }
            })
        );
    }

    /**
     * Start monitoring for permission requests
     */
    private startMonitoring(): void {
        // Check for timed-out requests every 10 seconds
        this.checkInterval = setInterval(() => {
            this.checkTimeouts();
        }, 10000);
    }

    /**
     * Analyze event for permission request patterns
     */
    private analyzePermissionRequest(event: ClaudeActivityEvent): void {
        const { source, details } = event;

        // Check for common permission request patterns
        const permissionPatterns = [
            {
                pattern: /permission/i,
                type: 'confirmation' as const,
                description: 'Permission request'
            },
            {
                pattern: /confirm|continue/i,
                type: 'confirmation' as const,
                description: 'Confirmation required'
            },
            {
                pattern: /access|read|write|create|delete/i,
                type: 'file-access' as const,
                description: 'File access request'
            },
            {
                pattern: /network|internet|http|https/i,
                type: 'network-access' as const,
                description: 'Network access request'
            },
            {
                pattern: /exec|run|command|shell/i,
                type: 'system-command' as const,
                description: 'System command request'
            },
            {
                pattern: /input|enter|type/i,
                type: 'user-input' as const,
                description: 'User input required'
            }
        ];

        const detailsText = details ? JSON.stringify(details).toLowerCase() : '';
        let detectedType: PermissionRequest['type'] = 'unknown';
        let description = 'Attention required';

        // Find matching pattern
        for (const pattern of permissionPatterns) {
            if (pattern.pattern.test(detailsText) || pattern.pattern.test(source.toLowerCase())) {
                detectedType = pattern.type;
                description = pattern.description;
                break;
            }
        }

        // Create permission request
        const request: PermissionRequest = {
            id: this.generateId(),
            type: detectedType,
            source,
            description,
            details,
            timestamp: new Date(),
            resolved: false,
            timeout: this.getDefaultTimeout(detectedType)
        };

        this.activeRequests.set(request.id, request);
        this.addToHistory(request);

        console.log(`Permission request detected: ${detectedType} from ${source}`);
    }

    /**
     * Get default timeout based on request type
     */
    private getDefaultTimeout(type: PermissionRequest['type']): number {
        const timeouts = {
            'file-access': 60000, // 1 minute
            'network-access': 120000, // 2 minutes
            'system-command': 30000, // 30 seconds
            'user-input': 300000, // 5 minutes
            'confirmation': 180000, // 3 minutes
            'unknown': 120000 // 2 minutes
        };

        return timeouts[type] || timeouts.unknown;
    }

    /**
     * Check for timed-out requests
     */
    private checkTimeouts(): void {
        const now = Date.now();

        for (const [id, request] of this.activeRequests) {
            if (!request.resolved && request.timeout) {
                const elapsed = now - request.timestamp.getTime();
                if (elapsed > request.timeout) {
                    request.resolved = true;
                    request.resolution = 'timeout';
                    this.addToHistory(request);
                    this.activeRequests.delete(id);

                    console.log(`Permission request timed out: ${request.type} from ${request.source}`);
                }
            }
        }
    }

    /**
     * Resolve pending requests from a specific source
     */
    private resolvePendingRequests(source: string, resolution: 'approved' | 'denied' | 'timeout'): void {
        for (const [id, request] of this.activeRequests) {
            if (request.source === source && !request.resolved) {
                request.resolved = true;
                request.resolution = resolution;
                this.addToHistory(request);
                this.activeRequests.delete(id);
            }
        }
    }

    /**
     * Manually approve a permission request
     */
    public approveRequest(id: string): boolean {
        const request = this.activeRequests.get(id);
        if (request && !request.resolved) {
            request.resolved = true;
            request.resolution = 'approved';
            this.addToHistory(request);
            this.activeRequests.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Manually deny a permission request
     */
    public denyRequest(id: string): boolean {
        const request = this.activeRequests.get(id);
        if (request && !request.resolved) {
            request.resolved = true;
            request.resolution = 'denied';
            this.addToHistory(request);
            this.activeRequests.delete(id);
            return true;
        }
        return false;
    }

    /**
     * Get active permission requests
     */
    public getActiveRequests(): PermissionRequest[] {
        return Array.from(this.activeRequests.values()).sort((a, b) =>
            a.timestamp.getTime() - b.timestamp.getTime()
        );
    }

    /**
     * Check if Claude is currently waiting for permissions
     */
    public isWaitingForPermission(): boolean {
        return this.activeRequests.size > 0;
    }

    /**
     * Get the oldest active request
     */
    public getOldestActiveRequest(): PermissionRequest | undefined {
        const active = this.getActiveRequests();
        return active.length > 0 ? active[0] : undefined;
    }

    /**
     * Get permission request history
     */
    public getRequestHistory(limit?: number): PermissionRequest[] {
        const sorted = [...this.requestHistory].sort((a, b) =>
            b.timestamp.getTime() - a.timestamp.getTime()
        );

        return limit ? sorted.slice(0, limit) : sorted;
    }

    /**
     * Get requests by type
     */
    public getRequestsByType(type: PermissionRequest['type']): PermissionRequest[] {
        return this.requestHistory.filter(r => r.type === type);
    }

    /**
     * Get requests by source
     */
    public getRequestsBySource(source: string): PermissionRequest[] {
        return this.requestHistory.filter(r => r.source === source);
    }

    /**
     * Get permission statistics
     */
    public getStatistics(): {
        active: number;
        total: number;
        approved: number;
        denied: number;
        timeout: number;
        byType: { [type: string]: number };
        averageResolutionTime?: number;
    } {
        const stats = {
            active: this.activeRequests.size,
            total: this.requestHistory.length,
            approved: 0,
            denied: 0,
            timeout: 0,
            byType: {} as { [type: string]: number },
            averageResolutionTime: undefined as number | undefined
        };

        let totalResolutionTime = 0;
        let resolvedCount = 0;

        this.requestHistory.forEach(request => {
            // Count by type
            stats.byType[request.type] = (stats.byType[request.type] || 0) + 1;

            // Count resolutions
            if (request.resolved) {
                switch (request.resolution) {
                    case 'approved':
                        stats.approved++;
                        break;
                    case 'denied':
                        stats.denied++;
                        break;
                    case 'timeout':
                        stats.timeout++;
                        break;
                }

                // Calculate resolution time if we have timeout info
                if (request.timeout) {
                    totalResolutionTime += Math.min(request.timeout, 60000); // Cap at 1 minute for average
                    resolvedCount++;
                }
            }
        });

        if (resolvedCount > 0) {
            stats.averageResolutionTime = totalResolutionTime / resolvedCount;
        }

        return stats;
    }

    /**
     * Add request to history
     */
    private addToHistory(request: PermissionRequest): void {
        // Remove from history if already exists
        this.requestHistory = this.requestHistory.filter(r => r.id !== request.id);

        // Add to history
        this.requestHistory.push(request);
        this.trimHistory();
    }

    /**
     * Trim history to maximum size
     */
    private trimHistory(): void {
        if (this.requestHistory.length > this.maxHistorySize) {
            const sorted = [...this.requestHistory].sort((a, b) =>
                b.timestamp.getTime() - a.timestamp.getTime()
            );
            this.requestHistory = sorted.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Clear all history and active requests
     */
    public clearHistory(): void {
        this.activeRequests.clear();
        this.requestHistory = [];
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Export permission data
     */
    public exportData(): any {
        return {
            activeRequests: Array.from(this.activeRequests.values()),
            requestHistory: this.requestHistory,
            statistics: this.getStatistics(),
            exportedAt: new Date().toISOString()
        };
    }

    public dispose(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        this.disposables.forEach(d => d.dispose());
    }
}