/**
 * Represents a proof that can be verified
 */
export interface Proof {
  /** The type of proof (e.g., 'opacity', 'reclaim', etc.) */
  type: string;
  /** The raw proof data */
  data: unknown;
  /** Timestamp when the proof was generated */
  timestamp: number;
  /** Optional metadata associated with the proof */
  metadata?: Record<string, unknown>;
}

/**
 * Result of a verifiable inference operation
 */
export interface VerifiableInferenceResult<T = string> {
  /** The generated content */
  content: T;
  /** The cryptographic proof of the generation */
  proof: Proof;
}

/**
 * Configuration options for verifiable operations
 */
export interface VerifiableOptions {
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Whether to skip proof verification (default: false) */
  skipVerification?: boolean;
  /** Additional options specific to the adapter */
  [key: string]: unknown;
}

/**
 * Error thrown when proof verification fails
 */
export class ProofVerificationError extends Error {
  constructor(
    message: string,
    public readonly proof: Proof,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ProofVerificationError';
  }
}

/**
 * Error thrown when proof generation fails
 */
export class ProofGenerationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ProofGenerationError';
  }
}

/**
 * Represents the status of a log entry in the data availability layer
 */
export interface DALogStatus {
  /** The type of status (e.g., 'stored', 'pending', 'failed') */
  type: string;
  /** The raw status data */
  data: unknown;
  /** Timestamp when the status was last updated */
  timestamp: number;
  /** Optional metadata associated with the status */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration options for DA logging operations
 */
export interface DALogOptions {
  /** Optional timeout in milliseconds */
  timeout?: number;
  /** Optional tags for categorizing logs */
  tags?: string[];
  /** Log level */
  level?: 'info' | 'warn' | 'error' | 'debug';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A log entry stored in the data availability layer
 */
export interface DALogEntry {
  /** Unique identifier for the log entry */
  id: string;
  /** The logged message or data */
  content: unknown;
  /** Timestamp when the log was created */
  timestamp: number;
  /** Status of the log in the DA layer */
  status: DALogStatus;
  /** Options used when creating the log */
  options?: DALogOptions;
}

/**
 * Error thrown when DA log storage fails
 */
export class DALogStorageError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DALogStorageError';
  }
}

/**
 * Error thrown when DA log retrieval fails
 */
export class DALogRetrievalError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DALogRetrievalError';
  }
} 