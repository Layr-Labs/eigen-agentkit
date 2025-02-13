# @layr-labs/agentkit-eigenda

A simple adapter for storing and retrieving data using EigenDA's data availability solution. Includes a buffered logging system that periodically streams logs to EigenDA.

## Installation

```bash
npm install @layr-labs/agentkit-eigenda
# or
pnpm add @layr-labs/agentkit-eigenda
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
import { EigenDAAdapter } from '@layr-labs/agentkit-eigenda';

// Initialize the adapter with custom flush settings
const eigenda = new EigenDAAdapter({
  privateKey: process.env.EIGENDA_PRIVATE_KEY!,
  apiUrl: process.env.EIGENDA_API_URL,
  rpcUrl: process.env.EIGENDA_RPC_URL,
  creditsContractAddress: process.env.EIGENDA_CREDITS_CONTRACT,
  flushInterval: 5000, // Flush every 5 seconds
  maxBufferSize: 3,  // Maximum logs to buffer before forcing a flush
  waitForConfirmation: false // Don't wait for confirmation by default
});

// Initialize the adapter (starts the flush timer)
await eigenda.initialize();

// Log messages with different levels
const infoPromise = eigenda.info('Application started', { version: '1.0.0' });
const warnPromise = eigenda.warn('High CPU usage', { cpu: 85 });
const errorPromise = eigenda.error('Database connection failed', { 
  error: 'Connection timeout',
  retries: 3 
});

// Structured logging with tags
const structuredPromise = eigenda.log({
  event: 'user_login',
  userId: '123',
  timestamp: new Date().toISOString(),
  success: true,
  details: {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    region: 'US-East'
  }
}, {
  level: 'info',
  tags: ['auth', 'security']
});

// Get log IDs when they become available
const [infoLog, warnLog, errorLog, structuredLog] = await Promise.all([
  infoPromise, warnPromise, errorPromise, structuredPromise
]);

console.log('Log IDs:', {
  info: infoLog.id,
  warn: warnLog.id,
  error: errorLog.id,
  structured: structuredLog.id
});

// Check balance
const balance = await eigenda.getBalance();
console.log('Current balance:', balance);

// Clean up when done
await eigenda.shutdown();
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
  waitForConfirmation?: boolean; // Don't wait for confirmation by default
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
  - Creates or retrieves an identifier for the adapter

- `getBalance(): Promise<number>`
  - Get the current balance for the adapter's identifier
  - Returns the balance in ETH

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

- `getIdentifier(): Uint8Array | undefined`
  - Get the current identifier being used by the adapter

- `getIdentifierHex(): string | undefined`
  - Get the hex string representation of the current identifier

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