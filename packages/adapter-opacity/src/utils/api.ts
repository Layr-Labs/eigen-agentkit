import { Proof } from '@eigen-labs/agentkit';

/**
 * Generate a proof for a log ID using the Opacity prover service
 */
export async function generateProof(proverUrl: string, logId: string): Promise<Proof> {
  const response = await fetch(`${proverUrl}/api/logs/${logId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to generate proof: ${response.statusText}`);
  }

  const result = await response.json();
  return {
    type: 'opacity',
    data: result,
    timestamp: Date.now(),
    metadata: {
      logId,
      proverUrl,
    },
  };
}

/**
 * Verify a proof using the Opacity prover service
 */
export async function verifyProof(proverUrl: string, proof: Proof): Promise<boolean> {
  if (proof.type !== 'opacity') {
    throw new Error('Invalid proof type');
  }

  const logId = proof.metadata?.logId as string;
  if (!logId) {
    throw new Error('Missing log ID in proof metadata');
  }

  const response = await fetch(`${proverUrl}/api/logs/${logId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to verify proof: ${response.statusText}`);
  }

  const result = await response.json();
  return result.success ?? true; // Default to true if success field is not present
} 