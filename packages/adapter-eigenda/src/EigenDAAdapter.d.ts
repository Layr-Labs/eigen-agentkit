import { IDALoggingAdapter, DALogOptions, DALogEntry, DALogStatus } from '@layr-labs/agentkit';
export interface EigenDAAdapterConfig {
    apiUrl?: string;
    rpcUrl?: string;
    privateKey: string;
    creditsContractAddress?: string;
    flushInterval?: number;
    maxBufferSize?: number;
    waitForConfirmation?: boolean;
}
export interface LogEntry {
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
    tempId?: string;
    data: unknown;
    options?: DALogOptions;
}
export interface PostResult {
    jobId: string;
    content: unknown;
    timestamp: number;
}
export interface DAStatus {
    jobId: string;
    status: string;
    timestamp: number;
}
export declare class EigenDAAdapter implements IDALoggingAdapter {
    private client;
    private identifier?;
    private logBuffer;
    private flushInterval;
    private maxBufferSize;
    private flushTimer?;
    private isInitialized;
    private config;
    private pendingLogs;
    constructor(config: EigenDAAdapterConfig);
    /**
     * Initialize the adapter and start the flush timer
     */
    initialize(minBalance?: number): Promise<void>;
    private startFlushTimer;
    /**
     * Stop the flush timer and flush any remaining logs
     */
    shutdown(): Promise<void>;
    /**
     * Log a message with the specified level
     */
    log(data: unknown, options?: DALogOptions): Promise<DALogEntry>;
    info(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    warn(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    error(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    debug(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    /**
     * Flush buffered logs to EigenDA
     */
    private flush;
    /**
     * Store a log entry in EigenDA
     */
    private storeLog;
    /**
     * Check if a log entry is available in EigenDA
     */
    checkAvailability(status: DALogStatus): Promise<boolean>;
    /**
     * Get the current balance for the adapter's identifier
     */
    getBalance(): Promise<number>;
    /**
     * Post data to EigenDA
     */
    post(data: unknown, options?: {
        waitForConfirmation?: boolean;
        tags?: string[];
        metadata?: Record<string, unknown>;
    }): Promise<PostResult>;
    /**
     * Retrieve data by job ID
     */
    get(jobId: string): Promise<unknown | null>;
    /**
     * Get the current identifier being used by the adapter
     */
    getIdentifier(): Uint8Array | undefined;
    /**
     * Get the hex string representation of the current identifier
     */
    getIdentifierHex(): string | undefined;
    /**
     * Get a specific log entry by ID
     */
    getLogEntry(id: string): Promise<DALogEntry | null>;
}
//# sourceMappingURL=EigenDAAdapter.d.ts.map