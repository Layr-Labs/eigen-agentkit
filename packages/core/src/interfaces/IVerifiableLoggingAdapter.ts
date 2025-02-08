import { Proof, VerifiableOptions } from '../types';

/**
 * Configuration for logging operations
 */
export interface LoggingOptions extends VerifiableOptions {
  /** Tags to associate with the log entry */
  tags?: string[];
  /** Log level (e.g., 'info', 'error', etc.) */
  level?: string;
  /** Additional metadata to store with the log */
  metadata?: Record<string, unknown>;
}

/**
 * A log entry that has been stored on-chain
 */
export interface VerifiableLogEntry {
  /** Unique identifier for the log entry */
  id: string;
  /** The logged message or data */
  content: unknown;
  /** Timestamp when the log was created */
  timestamp: number;
  /** Proof of the log being stored on-chain */
  proof: Proof;
  /** Options used when creating the log */
  options?: LoggingOptions;
}

/**
 * Interface for adapters that provide verifiable logging capabilities
 */
export interface IVerifiableLoggingAdapter {
  /**
   * Log data with a cryptographic proof of storage
   * @param data The data to log
   * @param options Logging options
   * @returns The log entry with its proof
   */
  log(data: unknown, options?: LoggingOptions): Promise<VerifiableLogEntry>;

  /**
   * Verify a proof from a previous log entry
   * @param proof The proof to verify
   * @returns True if the proof is valid
   */
  verifyProof(proof: Proof): Promise<boolean>;

  /**
   * Retrieve a log entry by its ID
   * @param id The log entry ID
   * @returns The log entry if found
   */
  getLogEntry(id: string): Promise<VerifiableLogEntry | null>;

  /**
   * Query log entries based on criteria
   * @param options Query options (implementation specific)
   * @returns Matching log entries
   */
  queryLogs(options: Record<string, unknown>): Promise<VerifiableLogEntry[]>;
} 