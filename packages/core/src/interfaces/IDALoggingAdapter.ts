import { DALogOptions, DALogStatus, DALogEntry } from '../types';

/**
 * Interface for adapters that store logs in a data availability layer
 */
export interface IDALoggingAdapter {
  /**
   * Initialize the adapter with any necessary setup
   */
  initialize(): Promise<void>;

  /**
   * Store a log entry in the data availability layer
   * @param data The data to log
   * @param options Logging options
   * @returns The stored log entry with its DA status
   */
  log(data: unknown, options?: DALogOptions): Promise<DALogEntry>;

  /**
   * Convenience method for info level logs
   */
  info(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;

  /**
   * Convenience method for warning level logs
   */
  warn(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;

  /**
   * Convenience method for error level logs
   */
  error(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;

  /**
   * Convenience method for debug level logs
   */
  debug(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;

  /**
   * Check if a log entry is available in the DA layer
   * @param status The DA status to check
   * @returns True if the log is available
   */
  checkAvailability(status: DALogStatus): Promise<boolean>;

  /**
   * Retrieve a specific log entry by ID
   * @param id The log entry ID
   * @returns The log entry if found
   */
  getLogEntry(id: string): Promise<DALogEntry | null>;

  /**
   * Clean up resources and ensure all logs are stored
   */
  shutdown(): Promise<void>;
} 