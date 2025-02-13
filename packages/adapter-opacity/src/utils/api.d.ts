import { Proof } from '@layr-labs/agentkit';
/**
 * Generate a proof for a log ID using the Opacity prover service
 */
export declare function generateProof(proverUrl: string, logId: string): Promise<Proof>;
/**
 * Verify a proof using the Opacity prover service
 */
export declare function verifyProof(proverUrl: string, proof: Proof): Promise<boolean>;
//# sourceMappingURL=api.d.ts.map