import {
  IDALoggingAdapter,
  DALogOptions,
  DALogEntry,
  DALogStatus,
  IVerifiableInferenceAdapter,
  GenerateTextOptions,
  VerifiableInferenceResult,
  ProofGenerationError,
  ProofVerificationError,
  Proof
} from '@eigenlayer/agentkit';
import { ModelProvider, OpacityAdapterConfig, ModelConfig } from './types';
import { generateProof, verifyProof } from './utils/api';

const DEFAULT_MODELS: Record<ModelProvider, Record<string, ModelConfig>> = {
  [ModelProvider.OPENAI]: {
    'gpt-4': {
      name: 'gpt-4',
      temperature: 0.7,
      maxOutputTokens: 2048,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
    'gpt-3.5-turbo': {
      name: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxOutputTokens: 2048,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
};

export class OpacityAdapter implements IVerifiableInferenceAdapter, IDALoggingAdapter {
  private readonly config: OpacityAdapterConfig;

  constructor(config: OpacityAdapterConfig) {
    this.config = {
      modelProvider: ModelProvider.OPENAI,
      gatewayUrl: `https://gateway.ai.cloudflare.com/v1/${config.teamId}/${config.teamName}`,
      ...config,
    };
  }

  async initialize(): Promise<void> {
    // No initialization needed for Opacity adapter
  }

  async log(data: unknown, options?: DALogOptions): Promise<DALogEntry> {
    const timestamp = Date.now();
    const logId = await this.storeLog(data, options);

    const status: DALogStatus = {
      type: 'opacity',
      data: {
        logId,
        proverUrl: this.config.opacityProverUrl,
      },
      timestamp,
    };

    return {
      id: logId,
      content: data,
      timestamp,
      status,
      options,
    };
  }

  private async storeLog(data: unknown, options?: DALogOptions): Promise<string> {
    const endpoint = `${this.config.gatewayUrl}/logs`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        data,
        metadata: options?.metadata,
        tags: options?.tags,
        level: options?.level || 'info',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to store log: ${response.statusText}`);
    }

    const logId = response.headers.get('cf-aig-log-id');
    if (!logId) {
      throw new Error('No log ID received from Cloudflare');
    }

    return logId;
  }

  async info(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'info', metadata });
  }

  async warn(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'warn', metadata });
  }

  async error(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'error', metadata });
  }

  async debug(message: string, metadata?: Record<string, unknown>): Promise<DALogEntry> {
    return this.log(message, { level: 'debug', metadata });
  }

  async checkAvailability(status: DALogStatus): Promise<boolean> {
    if (status.type !== 'opacity' || !status.data || typeof status.data !== 'object') {
      return false;
    }

    const { logId, proverUrl } = status.data as { logId?: string; proverUrl?: string };
    if (!logId || !proverUrl) {
      return false;
    }

    try {
      const response = await fetch(`${proverUrl}/api/logs/${logId}`);
      return response.ok;
    } catch (error) {
      console.error('Error checking log availability:', error);
      return false;
    }
  }

  async getLogEntry(id: string): Promise<DALogEntry | null> {
    try {
      const response = await fetch(`${this.config.opacityProverUrl}/api/logs/${id}`);
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return {
        id,
        content: data.data,
        timestamp: data.timestamp,
        status: {
          type: 'opacity',
          data: {
            logId: id,
            proverUrl: this.config.opacityProverUrl,
          },
          timestamp: data.timestamp,
        },
        options: {
          level: data.level,
          metadata: data.metadata,
          tags: data.tags,
        },
      };
    } catch (error) {
      console.error('Error retrieving log entry:', error);
      return null;
    }
  }

  async queryLogs(criteria: { startTime?: number; endTime?: number; level?: string; tags?: string[] }): Promise<DALogEntry[]> {
    // Opacity doesn't support querying logs directly
    return [];
  }

  async shutdown(): Promise<void> {
    // No cleanup needed for Opacity adapter
  }

  async generateText(
    prompt: string,
    options?: GenerateTextOptions,
  ): Promise<VerifiableInferenceResult> {
    const provider = this.config.modelProvider ?? ModelProvider.OPENAI;
    const model = options?.model || 'gpt-4';
    const providerModels = DEFAULT_MODELS[provider];

    if (!providerModels) {
      throw new Error(`Unsupported model provider: ${provider}`);
    }

    const modelConfig = providerModels[model];
    if (!modelConfig) {
      throw new Error(`Unsupported model: ${model}`);
    }

    const endpoint = `${this.config.gatewayUrl}/${provider}/chat/completions`;
    const body = {
      model: modelConfig.name,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: options?.temperature ?? modelConfig.temperature,
      max_tokens: options?.maxTokens ?? modelConfig.maxOutputTokens,
      frequency_penalty: modelConfig.frequencyPenalty,
      presence_penalty: modelConfig.presencePenalty,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const logId = response.headers.get('cf-aig-log-id');
      if (!logId) {
        throw new ProofGenerationError('No log ID received from Cloudflare');
      }

      const result = await response.json();
      const content = result.choices[0].message.content;

      const proof = await generateProof(this.config.opacityProverUrl, logId);

      return {
        content,
        proof,
      };
    } catch (error) {
      if (error instanceof ProofGenerationError) {
        throw error;
      }
      throw new ProofGenerationError('Failed to generate text with proof', error);
    }
  }

  async verifyProof(proof: Proof): Promise<boolean> {
    if (proof.type !== 'opacity') {
      throw new Error('Invalid proof type');
    }

    const logId = proof.metadata?.logId as string;
    if (!logId) {
      throw new Error('Missing log ID in proof metadata');
    }

    const result = await verifyProof(this.config.opacityProverUrl, logId, proof);
    return result.success;
  }
} 