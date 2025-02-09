# @eigenlayer/adapter-eigenda

A simple adapter for storing and retrieving data using EigenDA's data availability solution. Includes a buffered logging system that periodically streams logs to EigenDA.

## Installation

```bash
npm install @eigenlayer/adapter-eigenda
# or
pnpm add @eigenlayer/adapter-eigenda
```

## Configuration

The adapter requires the following environment variables:

```env
EIGENDA_PRIVATE_KEY=your_private_key
EIGENDA_API_URL=optional_api_url  # Optional: defaults to mainnet
EIGENDA_RPC_URL=optional_rpc_url  # Optional: defaults to mainnet
EIGENDA_CREDITS_CONTRACT=optional_contract_address  # Optional
```

## Usage

### Logging

The adapter provides a simple logging interface that buffers logs locally and periodically flushes them to EigenDA:

```typescript
import { EigenDAAdapter } from '@eigenlayer/adapter-eigenda';

// Initialize the adapter with custom flush settings
const adapter = new EigenDAAdapter({
  privateKey: process.env.EIGENDA_PRIVATE_KEY!,
  apiUrl: process.env.EIGENDA_API_URL,
  rpcUrl: process.env.EIGENDA_RPC_URL,
  creditsContractAddress: process.env.EIGENDA_CREDITS_CONTRACT,
  flushInterval: 10000, // Flush every 10 seconds (default)
  maxBufferSize: 1000,  // Maximum logs to buffer before forcing a flush (default)
});

// Initialize the adapter (starts the flush timer)
await adapter.initialize();

// Log messages with different levels
adapter.info('Application started', { version: '1.0.0' });
adapter.warn('Resource usage high', { cpu: 90, memory: 85 });
adapter.error('Failed to connect', { service: 'database' });
adapter.debug('Processing request', { requestId: '123' });

// Logs are automatically flushed to EigenDA every 10 seconds
// or when the buffer reaches maxBufferSize

// When shutting down your application, make sure to flush remaining logs
await adapter.shutdown();
```

### Direct Data Storage

For direct data storage without buffering:

```typescript
// Initialize the adapter
const adapter = new EigenDAAdapter({
  privateKey: process.env.EIGENDA_PRIVATE_KEY!,
  apiUrl: process.env.EIGENDA_API_URL,
  rpcUrl: process.env.EIGENDA_RPC_URL,
  creditsContractAddress: process.env.EIGENDA_CREDITS_CONTRACT,
});

await adapter.initialize();

// Post data
const result = await adapter.post(
  { message: 'Hello EigenDA!' },
  {
    waitForConfirmation: true, // Optional: wait for confirmation
    tags: ['test', 'example'], // Optional: add tags
    metadata: { source: 'example' }, // Optional: add metadata
  }
);

// Retrieve data
const data = await adapter.get(result.jobId);
```

## Features

- Buffered logging system with automatic flushing
- Direct data availability functions (`post`/`get`)
- Automatic identifier management and balance handling
- Supports metadata and tags
- TypeScript support with full type definitions
- Comprehensive error handling

## API Reference

### `EigenDAAdapter`

#### Constructor

```typescript
constructor(config: {
  apiUrl?: string;
  rpcUrl?: string;
  privateKey: string;
  creditsContractAddress?: string;
  flushInterval?: number;     // How often to flush logs (in ms), default: 10000
  maxBufferSize?: number;     // Max logs to buffer before forcing flush, default: 1000
})
```

#### Logging Methods

- `info(message: string, metadata?: Record<string, unknown>): void`
  - Log an info message
  - Optionally include metadata

- `warn(message: string, metadata?: Record<string, unknown>): void`
  - Log a warning message
  - Optionally include metadata

- `error(message: string, metadata?: Record<string, unknown>): void`
  - Log an error message
  - Optionally include metadata

- `debug(message: string, metadata?: Record<string, unknown>): void`
  - Log a debug message
  - Optionally include metadata

- `shutdown(): Promise<void>`
  - Stop the flush timer and flush any remaining logs
  - Call this when shutting down your application

#### Data Storage Methods

- `initialize(minBalance?: number): Promise<void>`
  - Initializes the adapter and starts the flush timer
  - `minBalance` defaults to 0.001 ETH

- `post(data: unknown, options?: PostOptions): Promise<PostResult>`
  - Posts data to EigenDA directly
  - Options:
    - `waitForConfirmation`: Wait for data to be confirmed
    - `tags`: Array of tags to associate with the data
    - `metadata`: Additional metadata
  - Returns:
    - `jobId`: Unique identifier for the upload
    - `content`: The uploaded data
    - `timestamp`: Upload timestamp

- `get(jobId: string): Promise<unknown | null>`
  - Retrieves previously posted data
  - Returns the data if found, null otherwise

## Error Handling

The adapter includes comprehensive error handling for:

- Network errors during upload/retrieval
- Buffer overflow protection
- Failed log flushes (retries on next interval)
- Missing or incorrect configuration
- Rate limiting or quota exceeded
- Insufficient balance
- Initialization errors

## License

MIT License 