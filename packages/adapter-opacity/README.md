# @eigenlayer/adapter-opacity

Opacity adapter for verifiable inference in EigenLayer AgentKit. This adapter integrates with Cloudflare's AI Gateway and Opacity's zkTLS proof system to provide verifiable AI inference capabilities.

## Installation

```bash
npm install @eigenlayer/adapter-opacity
# or
yarn add @eigenlayer/adapter-opacity
# or
pnpm add @eigenlayer/adapter-opacity
```

## Features

- 🔒 Verifiable AI inference using Opacity's zkTLS proofs
- 🤖 Support for OpenAI and Anthropic models through Cloudflare AI Gateway
- ✅ Proof generation and verification
- 🛠️ Highly configurable model parameters
- 💬 Full chat conversation support
- 🎯 Advanced sampling options (top-p, top-k)

## Usage

```typescript
import { OpacityAdapter, ModelProvider, ChatMessage } from '@eigenlayer/adapter-opacity';

// Initialize the adapter
const adapter = new OpacityAdapter({
  teamId: process.env.OPACITY_TEAM_ID!,
  teamName: process.env.OPACITY_TEAM_NAME!,
  apiKey: process.env.OPACITY_API_KEY!,
  opacityProverUrl: process.env.OPACITY_PROVER_URL!,
  modelProvider: ModelProvider.ANTHROPIC, // or ModelProvider.OPENAI
});

// Simple text generation with a single prompt
const simpleResult = await adapter.generateText('What is the meaning of life?', {
  model: 'gpt-4oo',
  temperature: 0.7,
  maxTokens: 1000,
});

// Chat conversation with multiple messages
const conversation: ChatMessage[] = [
  {
    role: 'system',
    content: 'You are a helpful AI assistant.'
  },
  {
    role: 'user',
    content: 'What is quantum computing?'
  },
  {
    role: 'assistant',
    content: 'Quantum computing is a type of computing that uses quantum phenomena...'
  },
  {
    role: 'user',
    content: 'Can you explain quantum entanglement?'
  }
];

const chatResult = await adapter.generateText(conversation, {
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
});

console.log('Generated text:', chatResult.content);
console.log('Proof:', chatResult.proof);

// Verify the proof
const isValid = await adapter.verifyProof(chatResult.proof);
console.log('Proof is valid:', isValid);
```

## Configuration

### Environment Variables

```env
OPACITY_TEAM_ID=your_team_id
OPACITY_TEAM_NAME=your_team_name
OPACITY_API_KEY=your_api_key
OPACITY_PROVER_URL=https://your-opacity-prover-url
```

### Adapter Options

The adapter supports various configuration options:

```typescript
interface OpacityAdapterConfig {
  teamId: string;
  teamName: string;
  apiKey: string;
  modelProvider?: ModelProvider; // OPENAI or ANTHROPIC
  opacityProverUrl: string;
  gatewayUrl?: string;
}
```

### Chat Messages

You can pass a conversation history using the `ChatMessage` interface:

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

### Model Options

When calling `generateText`, you can customize the model behavior:

```typescript
interface GenerateTextOptions {
  model?: string;                // Model name (e.g., 'gpt-4o', 'claude-3-5-sonnet-20241022')
  temperature?: number;          // Controls randomness (0-1)
  maxTokens?: number;           // Maximum tokens to generate
  systemPrompt?: string;        // System prompt for single-prompt generation
  topP?: number;                // Nucleus sampling parameter (0-1)
  topK?: number;                // Top-k sampling parameter
}
```

### Supported Models

#### OpenAI Models
- `gpt-4oo`
- `gpt-4o-mini`

#### Anthropic Models
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-5-haiku-20241022`

Each model comes with optimized default parameters that can be overridden using `GenerateTextOptions`.

## Error Handling

The adapter throws the following error types:
- `ProofGenerationError`: When proof generation fails
- `ProofVerificationError`: When proof verification fails

## Contributing

Please read the contributing guidelines in the root of the monorepo for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the LICENSE file for details. 