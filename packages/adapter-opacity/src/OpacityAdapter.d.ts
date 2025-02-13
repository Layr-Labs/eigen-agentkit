import { IDALoggingAdapter, DALogOptions, DALogEntry, DALogStatus, IVerifiableInferenceAdapter, GenerateTextOptions, VerifiableInferenceResult, Proof } from '@layr-labs/agentkit';
import { OpacityAdapterConfig } from './types';
export declare class OpacityAdapter implements IVerifiableInferenceAdapter, IDALoggingAdapter {
    private readonly config;
    constructor(config: OpacityAdapterConfig);
    initialize(): Promise<void>;
    log(data: unknown, options?: DALogOptions): Promise<DALogEntry>;
    private storeLog;
    info(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    warn(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    error(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    debug(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry>;
    checkAvailability(status: DALogStatus): Promise<boolean>;
    getLogEntry(id: string): Promise<DALogEntry | null>;
    shutdown(): Promise<void>;
    generateText(prompt: string, options?: GenerateTextOptions): Promise<VerifiableInferenceResult>;
    verifyProof(proof: Proof): Promise<boolean>;
}
//# sourceMappingURL=OpacityAdapter.d.ts.map