# @layr-labs/agentkit-witnesschain

## 📌 Overview
The **Witnesschain Adapter** is a TypeScript-based utility that enables an agent to request tasks and observations in the real physical world. This utility works in conjunction with the InfinityWatch app - that acts as a portal to the real world. 

The utility operates in 3 steps by sending requests to WitnessChain's API. 
- Step 1 is to create a "campaign" - a specific action/observation to be requested from the InfinityWatch app. A campaign created here will show up on the app for all users
- Step 2 is to fetch all geoverified observations made on the InfinityWatch app tied to your campaign and,
- Step 3 is to classify if those geoverified images actually performed the task/observation your requested. 

## 🚀 Features
- 📷 Upload multiple images for verification
- ⚡ Uses `axios` for efficient HTTP requests
- 💤 Handles file streams properly to prevent memory overload
- 🛠️ TypeScript support for better development experience
- 🔑 Ethereum-based authentication using private keys
- 🏛️ Create and manage blockchain campaigns

# @layr-labs/agentkit-witnesschain

## 📌 Overview
The **Witnesschain Adapter** is a TypeScript-based utility that enables image verification and blockchain-based campaign creation by sending requests to an API. It handles file uploads using `axios` and `form-data`, and integrates Ethereum-based authentication using `ethers`.

## Installation

```bash
npm install @layr-labs/agentkit-witnesschain
# or
yarn add @layr-labs/agentkit-witnesschain
# or
pnpm add @layr-labs/agentkit-witnesschain
```

## Features

- 📍 Verify location claims with 100+ mile accuracy
- 🌍 Global coverage through decentralized witness network
- ⛓️ Blockchain-based verification for trustless operation
- 🔒 Privacy-preserving location proofs
- ⚡ Fast and efficient verification process

## Configuration

### Environment Variables

```env
WITNESSCHAIN_API_KEY=your_api_key
WITNESSCHAIN_API_URL=https://api.witnesschain.com  # Optional: defaults to mainnet
WITNESSCHAIN_PRIVATE_KEY=your_private_key  # For submitting proofs
```

### Basic Usage

```typescript
import { WitnesschainAdapter } from '@layr-labs/agentkit-witnesschain';

// Initialize the adapter
const adapter = new WitnesschainAdapter({
  apiKey: process.env.WITNESSCHAIN_API_KEY!,
  apiUrl: process.env.WITNESSCHAIN_API_URL,
  privateKey: process.env.WITNESSCHAIN_PRIVATE_KEY!,
});

// Verify a location claim
const result = await adapter.verifyLocation({
  latitude: 40.7128,
  longitude: -74.0060,
  minDistance: 100, // minimum distance in miles
  timestamp: Date.now(),
});

console.log('Verification result:', result);
console.log('Proof:', result.proof);

// Verify the proof
const isValid = await adapter.verifyProof(result.proof);
console.log('Proof is valid:', isValid);
```

### Advanced Usage

```typescript
// Request location verification with specific parameters
const verification = await adapter.requestVerification({
  latitude: 40.7128,
  longitude: -74.0060,
  minDistance: 150, // increased minimum distance
  maxWitnesses: 5, // number of witnesses to use
  timeout: 3600, // timeout in seconds
  requireProof: true, // require cryptographic proof
});

// Check verification status
const status = await adapter.checkVerificationStatus(verification.id);

// Get verification details
const details = await adapter.getVerificationDetails(verification.id);
```

## API Reference

### `WitnesschainAdapter`

#### Constructor Options

```typescript
interface WitnesschainConfig {
  apiKey: string;
  apiUrl?: string;
  privateKey: string;
  defaultTimeout?: number;
  defaultMinDistance?: number;
  defaultMaxWitnesses?: number;
}
```

#### Methods

- `verifyLocation(params: LocationParams): Promise<VerificationResult>`
  - Verify a location claim
  - Returns verification result with proof

- `requestVerification(params: VerificationParams): Promise<VerificationRequest>`
  - Request a new location verification
  - More configurable than `verifyLocation`

- `checkVerificationStatus(id: string): Promise<VerificationStatus>`
  - Check the status of a verification request

- `getVerificationDetails(id: string): Promise<VerificationDetails>`
  - Get detailed information about a verification

- `verifyProof(proof: LocationProof): Promise<boolean>`
  - Verify a location proof
  - Returns true if the proof is valid

## Types

```typescript
interface LocationParams {
  latitude: number;
  longitude: number;
  minDistance: number;
  timestamp: number;
}

interface VerificationResult {
  success: boolean;
  proof: LocationProof;
  witnesses: number;
  timestamp: number;
}

interface LocationProof {
  type: 'witnesschain';
  data: {
    location: {
      latitude: number;
      longitude: number;
    };
    witnesses: string[];
    signatures: string[];
    timestamp: number;
  };
}
```

## Error Handling

The adapter throws the following error types:
- `VerificationError`: When location verification fails
- `ProofGenerationError`: When proof generation fails
- `ProofVerificationError`: When proof verification fails
- `NetworkError`: When API communication fails
- `ConfigurationError`: When adapter is misconfigured

## Contributing

Please read the contributing guidelines in the root of the monorepo for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the LICENSE file for details.

