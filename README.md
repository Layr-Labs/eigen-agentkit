# @layr-labs/agentkit

A modular and extensible agent framework that provides verifiable AI capabilities and data availability logging. It integrates multiple tools under one roof:

- Opacity for verifiable inference
- EigenDA for data availability logging
- WitnessChain for Real-world actuation and observation 
- Reclaim for verifiable API calls (TBD)
- Formation for verifiable code execution (TBD)
- Silence for secret publishing (TBD)

## Features

- 🔒 Verifiable AI inference with zkTLS proofs
- 📝 Data availability logging with EigenDA
- 📍 Real-world actuation and observation with Witnesschain InfinityWatch 
- 🔑 Verifiable API calls and external data integration
- ⚡ Composable with existing AI frameworks (LangChain, etc.)
- 🛠️ Modular adapter system for extensibility

## Project Structure

```
packages/
  ├── core/            - Core interfaces and types
  ├── adapter-opacity/ - Opacity adapter for verifiable inference
  ├── adapter-eigenda/ - EigenDA adapter for data availability logging
  ├── adapter-witnesschain/ - Witnesschain adapter for InfinityWatch
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
OPACITY_API_KEY=your_api_key
OPACITY_TEAM_ID=f309ac8ae8a9a14a7e62cd1a521b1c5f
OPACITY_TEAM_NAME=eigen-test
OPACITY_PROVER_URL=https://opacity-ai-zktls-demo.vercel.app

# EigenDA Configuration
EIGENDA_PRIVATE_KEY=your_private_key
EIGENDA_API_URL=https://test-agent-proxy-api.eigenda.xyz
EIGENDA_BASE_RPC_URL=https://mainnet.base.org
EIGENDA_CREDITS_CONTRACT=0x0CC001F1bDe9cd129092d4d24D935DB985Ce42A9

# Witnesschain Configuration
WITNESSCHAIN_API_KEY=your_api_key
WITNESSCHAIN_API_URL=https://api.witnesschain.com
WITNESSCHAIN_PRIVATE_KEY=your_private_key
```

## Usage

### Verifiable Inference with Opacity

```typescript
import { OpacityAdapter } from '@layr-labs/agentkit-opacity';

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
import { EigenDAAdapter } from '@layr-labs/agentkit-eigenda';

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

### Real-world Actuation and Observation with Witnesschain InfinityWatch
The **Witnesschain Adapter** is a TypeScript-based utility that enables an agent to request tasks and observations in the real world. It works in conjunction with the **InfinityWatch app**, which acts as a portal to the physical world.

#### **Usage**

```typescript
import { WitnesschainAdapter } from '@layr-labs/agentkit-witnesschain';

// Initialize adapter
const witnesschain = new WitnesschainAdapter();

// Authenticate with Ethereum-compatible wallet
const isLoggedIn = await witnesschain.login();
console.log("Login successful:", isLoggedIn);

// Create a new campaign
const campaign = await witnesschain.createCampaign({
  campaign: "Urban Pollution Check",
  description: "Collect images of high-smog areas for air quality analysis.",
  latitude: 37.7749,
  longitude: -122.4194,
  radius: 50, // Radius in kilometers
  reward_per_task: 5,
  total_rewards: 100,
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  is_active: true
});

console.log("Campaign Created:", campaign);

// Fetch geoverified observations
const observations = await witnesschain.getCampaignPhotos("Urban Pollution Check", null);
console.log("Received Observations:", observations);

// Classify and accept photos
const imagePaths = ["smog1.jpg", "smog2.jpg"];
const task = "Identify high-smog areas";

const classification = await witnesschain.classifyPhotos(imagePaths, task);
console.log("Classification Result:", classification);

if (classification.success) {
  await witnesschain.acceptPhoto("smog1.jpg");
}
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

## Contributors

Thanks to all our contributors who make AgentKit possible! 

<a href="https://github.com/Layr-Labs/eigen-agentkit/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Layr-Labs/eigen-agentkit" />
</a>

## License

This project is licensed under the MIT License - see the LICENSE file for details. 
