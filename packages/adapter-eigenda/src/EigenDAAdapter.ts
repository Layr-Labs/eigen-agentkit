import { IDALoggingAdapter, DALogOptions, DALogEntry, DALogStatus } from '@eigenlayer/agentkit';
import { EigenDAClient } from 'eigenda-sdk';

export interface EigenDAAdapterConfig {
  apiUrl?: string;
  rpcUrl?: string;
  privateKey: string;
  creditsContractAddress?: string;
  flushInterval?: number; // How often to flush logs (in ms), defaults to 10000 (10s)
  maxBufferSize?: number; // Max number of logs to buffer before forcing a flush
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
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

export class EigenDAAdapter implements IDALoggingAdapter {
  private client: EigenDAClient;
  private identifier?: Uint8Array;
  private logBuffer: LogEntry[] = [];
  private flushInterval: number;
  private maxBufferSize: number;
  private flushTimer?: ReturnType<typeof setInterval>;
  private isInitialized = false;

  constructor(config: EigenDAAdapterConfig) {
    this.client = new EigenDAClient({
      apiUrl: config.apiUrl,
      rpcUrl: config.rpcUrl,
      privateKey: config.privateKey,
      creditsContractAddress: config.creditsContractAddress,
    });
    this.flushInterval = config.flushInterval || 10000; // Default 10 seconds
    this.maxBufferSize = config.maxBufferSize || 1000; // Default 1000 logs
  }

  /**
   * Initialize the adapter and start the flush timer
   */
  async initialize(minBalance: number = 0.001): Promise<void> {
    if (this.isInitialized) return;

    // Get or create identifier
    const existingIdentifiers = await this.client.getIdentifiers();
    if (existingIdentifiers.length > 0) {
      this.identifier = existingIdentifiers[0];
    } else {
      this.identifier = await this.client.createIdentifier();
    }

    if (!this.identifier) {
      throw new Error('Failed to initialize identifier');
    }

    // Check and top up balance if needed
    const balance = await this.client.getBalance(this.identifier);
    if (balance < minBalance) {
      await this.client.topupCredits(this.identifier, minBalance);
    }

    // Start periodic flush
    this.startFlushTimer();
    this.isInitialized = true;
  }

  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }

  /**
   * Stop the flush timer and flush any remaining logs
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    await this.flush();
  }

  /**
   * Log a message with the specified level
   */
  async log(data: unknown, options?: DALogOptions): Promise<DALogEntry> {
    if (!this.isInitialized) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }

    const entry: LogEntry = {
      level: (options?.level || 'info') as 'info' | 'warn' | 'error' | 'debug',
      message: String(data),
      timestamp: Date.now(),
      metadata: options?.metadata,
    };

    this.logBuffer.push(entry);

    // Force flush if buffer is too large
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flush();
    }

    return this.storeLog(entry, options);
  }

  // Convenience methods for different log levels
  async info(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'info', metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'warn', metadata });
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'error', metadata });
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'debug', metadata });
  }

  /**
   * Flush buffered logs to EigenDA
   */
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logsToFlush = [...this.logBuffer];
    this.logBuffer = [];

    try {
      // Create a verifiable log entry
      const result = await this.storeLog(logsToFlush);
      if (!result) {
        throw new Error('Failed to store logs');
      }
    } catch (error) {
      console.error('Error flushing logs to EigenDA:', error);
      // Put the logs back in the buffer
      this.logBuffer = [...logsToFlush, ...this.logBuffer];
    }
  }

  /**
   * Store a log entry in EigenDA
   */
  private async storeLog(data: unknown, options?: DALogOptions): Promise<DALogEntry> {
    if (!this.identifier) {
      await this.initialize();
    }

    const content = JSON.stringify({
      data,
      metadata: options?.metadata || {},
      tags: options?.tags || [],
      level: options?.level || 'info',
      timestamp: Date.now(),
    });

    const uploadResult = await this.client.upload(content, this.identifier!);
    
    // Wait for confirmation that data is available
    const status = await this.client.waitForStatus(
      uploadResult.jobId,
      'CONFIRMED',
      30, // max checks
      20, // check interval (seconds)
      60  // initial delay (seconds)
    );

    const daStatus: DALogStatus = {
      type: 'eigenda',
      data: {
        jobId: uploadResult.jobId,
        status: String(status),
      },
      timestamp: Date.now(),
    };

    return {
      id: uploadResult.jobId,
      content: data,
      timestamp: Date.now(),
      status: daStatus,
      options,
    };
  }

  /**
   * Check if a log entry is available in EigenDA
   */
  async checkAvailability(status: DALogStatus): Promise<boolean> {
    if (status.type !== 'eigenda' || !status.data || typeof status.data !== 'object' || !('jobId' in status.data)) {
      return false;
    }

    try {
      const daStatus = await this.client.getStatus(status.data.jobId as string);
      const statusStr = String(daStatus);
      return ['CONFIRMED', 'completed'].includes(statusStr);
    } catch (error) {
      console.error('Error checking data availability:', error);
      return false;
    }
  }

  /**
   * Get the current balance for the adapter's identifier
   */
  async getBalance(): Promise<number> {
    if (!this.identifier) {
      throw new Error('Adapter not initialized. Call initialize() first.');
    }
    return this.client.getBalance(this.identifier);
  }

  /**
   * Post data to EigenDA
   */
  async post(data: unknown, options?: {
    waitForConfirmation?: boolean;
    tags?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<PostResult> {
    if (!this.identifier) {
      await this.initialize();
    }

    const content = JSON.stringify({
      data,
      metadata: options?.metadata || {},
      tags: options?.tags || [],
      timestamp: Date.now(),
    });

    const uploadResult = await this.client.upload(content, this.identifier);
    
    if (options?.waitForConfirmation) {
      await this.client.waitForStatus(
        uploadResult.jobId,
        'CONFIRMED',
        30, // max checks
        20, // check interval (seconds)
        60  // initial delay (seconds)
      );
    }

    return {
      jobId: uploadResult.jobId,
      content: data,
      timestamp: Date.now(),
    };
  }

  /**
   * Retrieve data by job ID
   */
  async get(jobId: string): Promise<unknown | null> {
    try {
      const data = await this.client.retrieve({
        jobId,
        waitForCompletion: true
      });

      const parsedData = JSON.parse(data);
      return parsedData.data;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Get the current identifier being used by the adapter
   */
  getIdentifier(): Uint8Array | undefined {
    return this.identifier;
  }

  /**
   * Get the hex string representation of the current identifier
   */
  getIdentifierHex(): string | undefined {
    return this.identifier ? Buffer.from(this.identifier).toString('hex') : undefined;
  }

  /**
   * Get a specific log entry by ID
   */
  async getLogEntry(id: string): Promise<DALogEntry | null> {
    try {
      const data = await this.get(id);
      if (!data) return null;

      const parsedData = JSON.parse(String(data));
      return {
        id,
        content: parsedData.data,
        timestamp: parsedData.timestamp,
        status: {
          type: 'eigenda',
          data: {
            jobId: id,
          },
          timestamp: parsedData.timestamp,
        },
        options: {
          level: parsedData.level,
          metadata: parsedData.metadata,
          tags: parsedData.tags,
        },
      };
    } catch (error) {
      console.error('Error retrieving log entry:', error);
      return null;
    }
  }

  /**
   * Query logs based on criteria
   */
  async queryLogs(criteria: { startTime?: number; endTime?: number; level?: string; tags?: string[] }): Promise<DALogEntry[]> {
    // Note: This is a placeholder implementation since EigenDA doesn't support querying directly
    // In a real implementation, you might want to maintain an index or use a separate storage
    return [];
  }
} 