/**
 * Supported model providers
 */
export enum ModelProvider {
  OPENAI = 'openai',
  // Add more providers as they become available
}

/**
 * Configuration for the Opacity adapter
 */
export interface OpacityAdapterConfig {
  /** Cloudflare team ID */
  teamId: string;
  /** Cloudflare team name */
  teamName: string;
  /** API key for the model provider */
  apiKey: string;
  /** Model provider (default: OPENAI) */
  modelProvider?: ModelProvider;
  /** Base URL for the Opacity prover service */
  opacityProverUrl: string;
  /** Base URL for the Cloudflare AI Gateway (optional) */
  gatewayUrl?: string;
}

/**
 * Model configuration
 */
export interface ModelConfig {
  /** Model name/identifier */
  name: string;
  /** Default temperature */
  temperature?: number;
  /** Maximum tokens to generate */
  maxOutputTokens?: number;
  /** Frequency penalty */
  frequencyPenalty?: number;
  /** Presence penalty */
  presencePenalty?: number;
}

/**
 * Response from the Opacity prover
 */
export interface OpacityProverResponse {
  /** Whether the proof is valid */
  success: boolean;
  /** Error message if verification failed */
  error?: string;
  /** Additional verification details */
  details?: unknown;
} 