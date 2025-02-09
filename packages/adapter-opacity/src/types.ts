/**
 * Supported model providers
 */
export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  // Add more providers as they become available
}

/**
 * Configuration for the Opacity adapter
 */
export interface OpacityAdapterConfig {
  /** The Cloudflare team ID */
  teamId: string;
  /** The Cloudflare team name */
  teamName: string;
  /** The API key for authentication */
  apiKey: string;
  /** The URL of the Opacity prover service */
  opacityProverUrl: string;
  /** The model provider to use (default: OPENAI) */
  modelProvider?: ModelProvider;
  /** Base URL for the Cloudflare AI Gateway (optional) */
  gatewayUrl?: string;
}

/**
 * Role of a chat message
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * A single message in a chat conversation
 */
export interface ChatMessage {
  /** The role of who sent the message */
  role: MessageRole;
  /** The content of the message */
  content: string;
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
  /** Top-p sampling (nucleus sampling) */
  topP?: number;
  /** Top-k sampling */
  topK?: number;
  /** System prompt for chat models */
  systemPrompt?: string;
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