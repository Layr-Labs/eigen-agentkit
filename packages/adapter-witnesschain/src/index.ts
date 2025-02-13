export * from './WitnesschainAdapter';
export * from './types';

// Re-export specific types that should be available to consumers
export type {
  WitnesschainConfig,
  LocationParams,
  VerificationResult,
  LocationProof,
  VerificationParams,
  VerificationRequest,
  VerificationStatus,
  VerificationDetails
} from './types';