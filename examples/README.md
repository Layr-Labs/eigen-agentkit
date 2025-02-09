# AgentKit Examples

This directory contains various examples demonstrating how to use AgentKit's adapters.

## Examples

### Basic Usage
- `basic-opacity.ts` - Simple verifiable inference using Opacity
- `basic-eigenda.ts` - Simple data availability logging using EigenDA

### Advanced Usage
- `chat-history.ts` - Chat application with verifiable history using both adapters
- `agent-monitoring.ts` - Monitoring AI agent actions with DA logging
- `batch-processing.ts` - Processing multiple tasks with verifiable results
- `error-handling.ts` - Proper error handling and recovery examples

## Running Examples

1. Install dependencies:
```bash
pnpm install
```

2. Set up your environment variables in `.env`:
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

3. Run an example:
```bash
ts-node examples/basic-opacity.ts
``` 