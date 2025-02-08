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
- 🤖 Support for OpenAI models through Cloudflare AI Gateway
- ✅ Proof generation and verification
- 🛠️ Configurable model parameters

## Usage

```typescript
import { OpacityAdapter, ModelProvider } from '@eigenlayer/adapter-opacity';

// Initialize the adapter
const adapter = new OpacityAdapter({
  teamId: process.env.OPACITY_TEAM_ID!,
  teamName: process.env.OPACITY_TEAM_NAME!,
  apiKey: process.env.OPACITY_API_KEY!,
  opacityProverUrl: process.env.OPACITY_PROVER_URL!,
  modelProvider: ModelProvider.OPENAI,
});

// Generate text with proof
const result = await adapter.generateText('What is the meaning of life?', {
  model: 'gpt-4',
  temperature: 0.7,
  maxTokens: 1000,
});

console.log('Generated text:', result.content);
console.log('Proof:', result.proof);

// Verify the proof
const isValid = await adapter.verifyProof(result.proof);
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

```typescript
interface OpacityAdapterConfig {
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
```

## Supported Models

Currently supports the following OpenAI models through Cloudflare AI Gateway:
- `gpt-4`
- `gpt-3.5-turbo`

## Error Handling

The adapter throws the following error types:
- `ProofGenerationError`: When proof generation fails
- `ProofVerificationError`: When proof verification fails

## Contributing

Please read the contributing guidelines in the root of the monorepo for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the LICENSE file for details. 