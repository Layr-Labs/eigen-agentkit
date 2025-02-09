# @eigenlayer/agentkit

A modular and extensible agent framework that provides verifiable AI capabilities and data availability logging. It integrates multiple tools under one roof:

- Opacity for verifiable inference
- EigenDA for data availability logging
- Reclaim for verifiable API calls (TBD)
- Formation for verifiable code execution (TBD)
- Silence for secret publishing (TBD)

## Features

- 🔒 Verifiable AI inference with zkTLS proofs
- 📝 Data availability logging with EigenDA
- 🔑 Verifiable API calls and external data integration
- ⚡ Composable with existing AI frameworks (LangChain, etc.)
- 🛠️ Modular adapter system for extensibility

## Project Structure

```
packages/
  ├── core/            - Core interfaces and types
  ├── adapter-opacity/ - Opacity adapter for verifiable inference
  ├── adapter-eigenda/ - EigenDA adapter for data availability logging
  ├── adapter-reclaim/ - Reclaim adapter for API calls (TBD)
  ├── adapter-formation/ - Formation adapter for code execution (TBD)
  ├── adapter-silence/ - Silence adapter for secret publishing (TBD)
  └── agent/           - Main agent implementation (TBD)
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
# Opacity Configuration
OPACITY_TEAM_ID=your_team_id
OPACITY_TEAM_NAME=your_team_name
OPACITY_API_KEY=your_api_key
OPACITY_PROVER_URL=your_prover_url

# EigenDA Configuration
EIGENDA_PRIVATE_KEY=your_private_key
EIGENDA_API_URL=https://test-agent-proxy-api.eigenda.xyz
EIGENDA_BASE_RPC_URL=https://mainnet.base.org
EIGENDA_CREDITS_CONTRACT=0x0CC001F1bDe9cd129092d4d24D935DB985Ce42A9
```

## Usage

### Verifiable Inference with Opacity

```typescript
import { OpacityAdapter } from '@eigenlayer/agentkit-opacity';

// Initialize adapter
const opacityAdapter = new OpacityAdapter({
  teamId: process.env.OPACITY_TEAM_ID!,
  teamName: process.env.OPACITY_TEAM_NAME!,
  apiKey: process.env.OPACITY_API_KEY!,
  opacityProverUrl: process.env.OPACITY_PROVER_URL!,
});

// Generate text with proof
const result = await opacityAdapter.generateText('Your prompt here');
console.log('Generated text:', result.content);
console.log('Proof:', result.proof);

// Verify the proof
const isValid = await opacityAdapter.verifyProof(result.proof);
console.log('Proof is valid:', isValid);
```

### Data Availability Logging with EigenDA

```typescript
import { EigenDAAdapter } from '@eigenlayer/agentkit-eigenda';

// Initialize adapter
const eigenDAAdapter = new EigenDAAdapter({
  privateKey: process.env.EIGENDA_PRIVATE_KEY!,
  // Optional
  apiUrl: process.env.EIGENDA_API_URL,
  rpcUrl: process.env.EIGENDA_BASE_RPC_URL,
  creditsContractAddress: process.env.EIGENDA_CREDITS_CONTRACT,
});

// Initialize the adapter (required before logging)
await eigenDAAdapter.initialize();

// Log messages with different levels
await eigenDAAdapter.info('Application started', { version: '1.0.0' });
await eigenDAAdapter.warn('Resource usage high', { cpu: 90, memory: 85 });
await eigenDAAdapter.error('Failed to connect', { service: 'database' });
await eigenDAAdapter.debug('Processing request', { requestId: '123' });

// Check if a log is available
const logEntry = await eigenDAAdapter.info('Test message');
const isAvailable = await eigenDAAdapter.checkAvailability(logEntry.status);
console.log('Log is available:', isAvailable);

// Retrieve a log entry
const retrievedLog = await eigenDAAdapter.getLogEntry(logEntry.id);
console.log('Retrieved log:', retrievedLog);

// Clean up when done
await eigenDAAdapter.shutdown();
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