import { IDALoggingAdapter, DALogOptions, DALogEntry, DALogStatus } from '@layr-labs/agentkit';
import { EigenDAClient } from 'eigenda-sdk';

export interface EigenDAAdapterConfig {
  apiUrl?: string;
  rpcUrl?: string;
  privateKey: string;
  creditsContractAddress?: string;
  flushInterval?: number; // How often to flush logs (in ms), defaults to 10000 (10s)
  maxBufferSize?: number; // Max number of logs to buffer before forcing a flush
  waitForConfirmation?: boolean; // Whether to wait for confirmation by default, defaults to false
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

export class EigenDAAdapter implements IDALoggingAdapter {
  private client: EigenDAClient;
  private identifier?: Uint8Array;
  private logBuffer: LogEntry[] = [];
  private flushInterval: number;
  private maxBufferSize: number;
  private flushTimer?: ReturnType<typeof setInterval>;
  private isInitialized = false;
  private config: EigenDAAdapterConfig;
  private pendingLogs: Map<string, { resolve: (entry: DALogEntry) => void }> = new Map();

  constructor(config: EigenDAAdapterConfig) {
    this.client = new EigenDAClient({
      apiUrl: config.apiUrl,
      rpcUrl: config.rpcUrl,
      privateKey: config.privateKey,
      creditsContractAddress: config.creditsContractAddress,
    });
    this.flushInterval = config.flushInterval || 10000; // Default 10 seconds
    this.maxBufferSize = config.maxBufferSize || 1000; // Default 1000 logs
    this.config = config;
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
      message: typeof data === 'object' ? JSON.stringify(data) : String(data),
      timestamp: Date.now(),
      metadata: options?.metadata,
      data,
      options,
    };

    // Create a promise that will be resolved when we get the real job ID
    const tempId = `temp-${Date.now()}-${this.logBuffer.length + 1}`;
    const logPromise = new Promise<DALogEntry>((resolve) => {
      this.pendingLogs.set(tempId, { resolve });
    });

    this.logBuffer.push({
      ...entry,
      tempId,
    });

    // Force flush if buffer is too large
    if (this.logBuffer.length >= this.maxBufferSize) {
      await this.flush();
    }

    return logPromise;
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
      // Merge all logs into a single batch
      const batchedLogs = {
        logs: logsToFlush.map(log => ({
          level: log.level,
          message: log.message,
          timestamp: log.timestamp,
          metadata: log.metadata,
          data: log.data,
          options: log.options
        })),
        timestamp: Date.now(),
        type: 'log_batch'
      };

      // Upload the batched logs
      const content = JSON.stringify(batchedLogs);
      const uploadResult = await this.client.upload(content, this.identifier!);
      
      // Extract job_id from the response
      const jobId = (uploadResult as any).job_id;
      if (!jobId) {
        throw new Error('Failed to get job_id from upload result');
      }

      // Create the status object
      const daStatus: DALogStatus = {
        type: 'eigenda',
        data: {
          jobId,
          status: 'PENDING'
        },
        timestamp: Date.now(),
      };

      // Resolve all pending log promises with the real job ID
      for (const log of logsToFlush) {
        const pendingLog = this.pendingLogs.get(log.tempId!);
        if (pendingLog) {
          pendingLog.resolve({
            id: jobId,
            content: log.data,
            timestamp: log.timestamp,
            status: daStatus,
            options: log.options
          });
          this.pendingLogs.delete(log.tempId!);
        }
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
    
    // Extract job_id from the response
    const jobId = (uploadResult as any).job_id;
    if (!jobId) {
      throw new Error('Failed to get job_id from upload result');
    }

    // Create status without waiting for confirmation
    const daStatus: DALogStatus = {
      type: 'eigenda',
      data: {
        jobId: jobId,
        status: 'PENDING'
      },
      timestamp: Date.now(),
    };

    return {
      id: jobId,
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

      // Handle batched logs
      const batchedData = data as { type?: string; logs?: any[] };
      if (batchedData.type === 'log_batch' && Array.isArray(batchedData.logs)) {
        // Return the first log in the batch for now
        // You might want to implement a way to retrieve specific logs from the batch
        const log = batchedData.logs[0];
        return {
          id,
          content: log.data,
          timestamp: log.timestamp,
          status: {
            type: 'eigenda',
            data: {
              jobId: id,
              status: 'PENDING'
            },
            timestamp: log.timestamp,
          },
          options: log.options,
        };
      }

      // Handle single log
      const parsedData = JSON.parse(String(data));
      return {
        id,
        content: parsedData.data,
        timestamp: parsedData.timestamp,
        status: {
          type: 'eigenda',
          data: {
            jobId: id,
            status: 'PENDING'
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
} 