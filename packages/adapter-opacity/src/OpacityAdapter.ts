import {
  IVerifiableInferenceAdapter,
  GenerateTextOptions,
  VerifiableInferenceResult,
  Proof,
  ProofGenerationError,
} from '@eigenlayer/agentkit-core';
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

export class OpacityAdapter implements IVerifiableInferenceAdapter {
  private readonly config: OpacityAdapterConfig;

  constructor(config: OpacityAdapterConfig) {
    this.config = {
      modelProvider: ModelProvider.OPENAI,
      gatewayUrl: `https://gateway.ai.cloudflare.com/v1/${config.teamId}/${config.teamName}`,
      ...config,
    };
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