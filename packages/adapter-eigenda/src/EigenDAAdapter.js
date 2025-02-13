"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EigenDAAdapter = void 0;
const eigenda_sdk_1 = require("eigenda-sdk");
class EigenDAAdapter {
    constructor(config) {
        this.logBuffer = [];
        this.isInitialized = false;
        this.pendingLogs = new Map();
        this.client = new eigenda_sdk_1.EigenDAClient({
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
    async initialize(minBalance = 0.001) {
        if (this.isInitialized)
            return;
        // Get or create identifier
        const existingIdentifiers = await this.client.getIdentifiers();
        if (existingIdentifiers.length > 0) {
            this.identifier = existingIdentifiers[0];
        }
        else {
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
    startFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
    /**
     * Stop the flush timer and flush any remaining logs
     */
    async shutdown() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
        await this.flush();
    }
    /**
     * Log a message with the specified level
     */
    async log(data, options) {
        if (!this.isInitialized) {
            throw new Error('Adapter not initialized. Call initialize() first.');
        }
        const entry = {
            level: (options?.level || 'info'),
            message: typeof data === 'object' ? JSON.stringify(data) : String(data),
            timestamp: Date.now(),
            metadata: options?.metadata,
            data,
            options,
        };
        // Create a promise that will be resolved when we get the real job ID
        const tempId = `temp-${Date.now()}-${this.logBuffer.length + 1}`;
        const logPromise = new Promise((resolve) => {
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
    async info(message, metadata) {
        return this.log(message, { level: 'info', metadata });
    }
    async warn(message, metadata) {
        return this.log(message, { level: 'warn', metadata });
    }
    async error(message, metadata) {
        return this.log(message, { level: 'error', metadata });
    }
    async debug(message, metadata) {
        return this.log(message, { level: 'debug', metadata });
    }
    /**
     * Flush buffered logs to EigenDA
     */
    async flush() {
        if (this.logBuffer.length === 0)
            return;
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
            const uploadResult = await this.client.upload(content, this.identifier);
            // Extract job_id from the response
            const jobId = uploadResult.job_id;
            if (!jobId) {
                throw new Error('Failed to get job_id from upload result');
            }
            // Create the status object
            const daStatus = {
                type: 'eigenda',
                data: {
                    jobId,
                    status: 'PENDING'
                },
                timestamp: Date.now(),
            };
            // Resolve all pending log promises with the real job ID
            for (const log of logsToFlush) {
                const pendingLog = this.pendingLogs.get(log.tempId);
                if (pendingLog) {
                    pendingLog.resolve({
                        id: jobId,
                        content: log.data,
                        timestamp: log.timestamp,
                        status: daStatus,
                        options: log.options
                    });
                    this.pendingLogs.delete(log.tempId);
                }
            }
        }
        catch (error) {
            console.error('Error flushing logs to EigenDA:', error);
            // Put the logs back in the buffer
            this.logBuffer = [...logsToFlush, ...this.logBuffer];
        }
    }
    /**
     * Store a log entry in EigenDA
     */
    async storeLog(data, options) {
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
        const uploadResult = await this.client.upload(content, this.identifier);
        // Extract job_id from the response
        const jobId = uploadResult.job_id;
        if (!jobId) {
            throw new Error('Failed to get job_id from upload result');
        }
        // Create status without waiting for confirmation
        const daStatus = {
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
    async checkAvailability(status) {
        if (status.type !== 'eigenda' || !status.data || typeof status.data !== 'object' || !('jobId' in status.data)) {
            return false;
        }
        try {
            const daStatus = await this.client.getStatus(status.data.jobId);
            const statusStr = String(daStatus);
            return ['CONFIRMED', 'completed'].includes(statusStr);
        }
        catch (error) {
            console.error('Error checking data availability:', error);
            return false;
        }
    }
    /**
     * Get the current balance for the adapter's identifier
     */
    async getBalance() {
        if (!this.identifier) {
            throw new Error('Adapter not initialized. Call initialize() first.');
        }
        return this.client.getBalance(this.identifier);
    }
    /**
     * Post data to EigenDA
     */
    async post(data, options) {
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
            await this.client.waitForStatus(uploadResult.jobId, 'CONFIRMED', 30, // max checks
            20, // check interval (seconds)
            60 // initial delay (seconds)
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
    async get(jobId) {
        try {
            const data = await this.client.retrieve({
                jobId,
                waitForCompletion: true
            });
            const parsedData = JSON.parse(data);
            return parsedData.data;
        }
        catch (error) {
            console.error('Error retrieving data:', error);
            return null;
        }
    }
    /**
     * Get the current identifier being used by the adapter
     */
    getIdentifier() {
        return this.identifier;
    }
    /**
     * Get the hex string representation of the current identifier
     */
    getIdentifierHex() {
        return this.identifier ? Buffer.from(this.identifier).toString('hex') : undefined;
    }
    /**
     * Get a specific log entry by ID
     */
    async getLogEntry(id) {
        try {
            const data = await this.get(id);
            if (!data)
                return null;
            // Handle batched logs
            const batchedData = data;
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
        }
        catch (error) {
            console.error('Error retrieving log entry:', error);
            return null;
        }
    }
}
exports.EigenDAAdapter = EigenDAAdapter;
//# sourceMappingURL=EigenDAAdapter.js.map