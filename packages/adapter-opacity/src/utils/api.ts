import { OpacityProverResponse } from '../types';
import { Proof, ProofVerificationError } from '@eigenlayer/agentkit-core';

/**
 * Verify a proof using the Opacity prover service
 */
export async function verifyProof(
  proverUrl: string,
  logId: string,
  proof: Proof,
): Promise<OpacityProverResponse> {
  const response = await fetch(`${proverUrl}/api/verify/${logId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(proof),
  });

  if (!response.ok) {
    throw new ProofVerificationError(
      `Failed to verify proof: ${response.statusText}`,
      proof,
      await response.text(),
    );
  }

  return response.json();
}

/**
 * Generate a proof for a log ID using the Opacity prover service
 */
export async function generateProof(proverUrl: string, logId: string): Promise<Proof> {
  const response = await fetch(`${proverUrl}/api/logs/${logId}`);

  if (!response.ok) {
    throw new Error(`Failed to generate proof: ${response.statusText}`);
  }

  const proofData = await response.json();
  return {
    type: 'opacity',
    data: proofData,
    timestamp: Date.now(),
    metadata: {
      logId,
      proverUrl,
    },
  };
} 