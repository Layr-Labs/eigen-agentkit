# @eigenlayer/agentkit

A modular and extensible agent framework that provides verifiable AI capabilities. It integrates multiple verifiable tools under one roof:

- Opacity for verifiable inference
- EigenDA for publically visible logging and proof posting (TBD)
- Reclaim for verifiable API calls (TBD)
- Formation for verifiable code execution (TBD)
- Silence for secret publishing (TBD)

## Features

- 🔒 Verifiable AI inference with zkTLS proofs
- 📝 Logging of agent actions
- 🔑 Verifiable API calls and external data integration
- ⚡ Composable with existing AI frameworks (LangChain, etc.)
- 🛠️ Modular adapter system for extensibility

## Project Structure

```
packages/
  ├── core/            - Core interfaces and types
  ├── adapter-opacity/ - Opacity adapter for verifiable inference
  ├── adapter-eigenda/ - EigenDA adapter for logging
  ├── adapter-reclaim/ - Reclaim adapter for API calls
  ├── adapter-formation/ - Formation adapter for code execution
  ├── adapter-silence/ - Silence adapter for secret publishing
  └── agent/           - Main agent implementation
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8.15.1

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Opacity
OPACITY_TEAM_ID=your_team_id
OPACITY_API_KEY=your_api_key

# Additional variables for other adapters will be documented
# as they are implemented
```

## Usage

Basic example of using the verifiable agent:

```typescript
import { VerifiableAgent } from '@eigenlayer/agentkit';
import { OpacityAdapter } from '@eigenlayer/adapter-opacity';
import { EigenDAAdapter } from '@eigenlayer/adapter-eigenda';

// Initialize adapters
const inferenceAdapter = new OpacityAdapter({
  teamId: process.env.OPACITY_TEAM_ID,
  apiKey: process.env.OPACITY_API_KEY,
});

// Create agent
const agent = new VerifiableAgent({
  inferenceAdapter,
  // Add other adapters as needed
});

// Generate text with proof
const result = await agent.generate('Your prompt here');
console.log('Generated text:', result.text);
console.log('Proof:', result.proof);

// Verify the proof
const isValid = await inferenceAdapter.verifyProof(result.proof);
console.log('Proof is valid:', isValid);
```

## Development

```bash
# Start development mode
pnpm dev

# Lint code
pnpm lint

# Format code
pnpm format
```

## Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 