/**
 * Represents a zkTLS proof that can be verified
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