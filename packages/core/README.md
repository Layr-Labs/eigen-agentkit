# eigenlayer-agentkit

Core interfaces and types for the EigenLayer AgentKit framework. This package provides the foundation for building verifiable AI agents with zkTLS proofs.

## Installation

```bash
npm install eigenlayer-agentkit
# or
yarn add eigenlayer-agentkit
# or
pnpm add eigenlayer-agentkit
```

## Features

- Type definitions for zkTLS proofs and verifiable operations
- Interface definitions for verifiable inference adapters
- Interface definitions for verifiable logging adapters
- Common error types and utilities

## Usage

### Implementing a Verifiable Inference Adapter

```typescript
import { 
  IVerifiableInferenceAdapter, 
  VerifiableInferenceResult,
  Proof,
  GenerateTextOptions
} from 'eigenlayer-agentkit';

class MyInferenceAdapter implements IVerifiableInferenceAdapter {
  async generateText(
    prompt: string,
    options?: GenerateTextOptions
  ): Promise<VerifiableInferenceResult> {
    // Implementation here
  }

  async verifyProof(proof: Proof): Promise<boolean> {
    // Implementation here
  }
}
```

### Implementing a Verifiable Logging Adapter

```typescript
import {
  IVerifiableLoggingAdapter,
  VerifiableLogEntry,
  Proof,
  LoggingOptions
} from 'eigenlayer-agentkit';

class MyLoggingAdapter implements IVerifiableLoggingAdapter {
  async log(
    data: unknown,
    options?: LoggingOptions
  ): Promise<VerifiableLogEntry> {
    // Implementation here
  }

  async verifyProof(proof: Proof): Promise<boolean> {
    // Implementation here
  }

  async getLogEntry(id: string): Promise<VerifiableLogEntry | null> {
    // Implementation here
  }

  async queryLogs(options: Record<string, unknown>): Promise<VerifiableLogEntry[]> {
    // Implementation here
  }
}
```

## API Reference

### Types

#### `Proof`
Represents a cryptographic proof that can be verified.

```typescript
interface Proof {
  type: string;
  data: unknown;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
```

#### `VerifiableInferenceResult<T = string>`
Result of a verifiable inference operation.

```typescript
interface VerifiableInferenceResult<T = string> {
  content: T;
  proof: Proof;
}
```

### Interfaces

#### `IVerifiableInferenceAdapter`
Interface for adapters that provide verifiable inference capabilities.

#### `IVerifiableLoggingAdapter`
Interface for adapters that provide verifiable logging capabilities.

### Error Types

#### `ProofVerificationError`
Thrown when proof verification fails.

#### `ProofGenerationError`
Thrown when proof generation fails.

## Contributing

Please read the contributing guidelines in the root of the monorepo for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the LICENSE file for details. 