import { Proof, VerifiableInferenceResult, VerifiableOptions } from '../types';
/**
 * Configuration for text generation
 */
export interface GenerateTextOptions extends VerifiableOptions {
    /** The model to use for generation */
    model?: string;
    /** Temperature for controlling randomness (0-1) */
    temperature?: number;
    /** Maximum number of tokens to generate */
    maxTokens?: number;
    /** Stop sequences that will halt generation */
    stop?: string[];
}
/**
 * Interface for adapters that provide verifiable inference capabilities
 */
export interface IVerifiableInferenceAdapter {
    /**
     * Generate text with a cryptographic proof
     * @param prompt The input prompt
     * @param options Generation options
     * @returns The generated text and its proof
     * @throws {ProofGenerationError} If proof generation fails
     */
    generateText(prompt: string, options?: GenerateTextOptions): Promise<VerifiableInferenceResult>;
    /**
     * Verify a proof from a previous generation
     * @param proof The proof to verify
     * @returns True if the proof is valid
     * @throws {ProofVerificationError} If verification fails
     */
    verifyProof(proof: Proof): Promise<boolean>;
}
//# sourceMappingURL=IVerifiableInferenceAdapter.d.ts.map