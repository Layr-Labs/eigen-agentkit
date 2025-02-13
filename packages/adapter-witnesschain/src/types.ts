export interface WitnesschainConfig {
  apiKey: string;
  apiUrl?: string;
  privateKey: string;
  defaultTimeout?: number;
  defaultMinDistance?: number;
  defaultMaxWitnesses?: number;
}

export interface LocationParams {
  latitude: number;
  longitude: number;
  minDistance: number;
  timestamp: number;
}

export interface VerificationResult {
  success: boolean;
  proof: LocationProof;
  witnesses: number;
  timestamp: number;
}

export interface LocationProof {
  type: 'witnesschain';
  data: {
    location: {
      latitude: number;
      longitude: number;
    };
    witnesses: string[];
    signatures: string[];
    timestamp: number;
  };
}

export interface VerificationParams extends LocationParams {
  maxWitnesses?: number;
  timeout?: number;
  requireProof?: boolean;
}

export interface VerificationRequest {
  id: string;
  status: VerificationStatus;
  params: VerificationParams;
  timestamp: number;
}

export type VerificationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VerificationDetails extends VerificationRequest {
  result?: VerificationResult;
  error?: string;
} 