# @eigenlayer/agentkit-witness

A TypeScript adapter for interacting with the Witnesschain API, designed for integration with EigenLayer AgentKit. This adapter provides a robust interface for verifying photos, managing campaigns, and interacting with the Witnesschain blockchain.

## Features

- Photo verification with support for multiple images
- Campaign management (create, list, get photos)
- Ethereum wallet integration for authentication
- Comprehensive error handling with detailed error types
- TypeScript support with full type definitions
- Automatic cookie management for session handling

## Installation

```bash
npm install @eigenlayer/agentkit-witness
```

## Quick Start

```typescript
import { WitnesschainAdapter } from '@agentkit/adapter-witnesschain';

// Initialize the adapter
const adapter = new WitnesschainAdapter({
  privateKey: 'your-ethereum-private-key',
  // Optional configurations
  apiUrl: 'custom-api-url',
  blockchainApiUrl: 'custom-blockchain-api-url'
});

// Authenticate with the service
try {
  const authenticated = await adapter.authenticate(37.7749, -122.4194);
  console.log('Authentication successful');
} catch (error) {
  if (error.code === 'NO_WALLET') {
    console.error('No wallet configured');
  } else {
    console.error('Authentication failed:', error.message);
  }
}
```

## Error Handling

The adapter uses a custom `WitnesschainError` class that provides detailed error information:

```typescript
try {
  await adapter.verifyPhotos(['photo.jpg'], 'Verify this location');
} catch (error) {
  if (error.code === 'FILE_NOT_FOUND') {
    console.error('Photo file not found');
  } else if (error.code === 'FILE_TOO_LARGE') {
    console.error('Photo exceeds size limit (10MB)');
  } else {
    console.error('Verification failed:', error.message);
  }
}
```

## API Reference

### Constructor

```typescript
new WitnesschainAdapter(config?: WitnesschainConfig)
```

Configuration options:
- `privateKey`: Ethereum private key for authentication
- `apiUrl`: Custom API URL (optional)
- `blockchainApiUrl`: Custom blockchain API URL (optional)

### Methods

#### authenticate
```typescript
async authenticate(latitude: number, longitude: number): Promise<boolean>
```
Authenticates with the Witnesschain service using the configured wallet.

#### verifyPhotos
```typescript
async verifyPhotos(imagePaths: string[], task: string): Promise<PhotoVerificationResult>
```
Verifies a list of photos against a given task description.

#### createCampaign
```typescript
async createCampaign(params: CampaignCreateParams): Promise<Campaign>
```
Creates a new campaign with the specified parameters.

#### getCampaigns
```typescript
async getCampaigns(): Promise<Campaign[]>
```
Retrieves all available campaigns.

#### getCampaignPhotos
```typescript
async getCampaignPhotos(campaign: string, since?: string | null): Promise<string[]>
```
Gets photos from a specific campaign.

#### acceptPhoto
```typescript
async acceptPhoto(photo: string): Promise<boolean>
```
Accepts a verified photo for rewards.

#### getBalance
```typescript
async getBalance(): Promise<Balance>
```
Gets the current account balance.

## Types

### WitnesschainConfig
```typescript
interface WitnesschainConfig {
  apiUrl?: string;
  blockchainApiUrl?: string;
  privateKey?: string;
}
```

### CampaignCreateParams
```typescript
interface CampaignCreateParams {
  campaignName: string;
  description: string;
  createdBy: string;
  latitude: number;
  longitude: number;
  radius: number;
  totalRewards: number;
  rewardPerTask: number;
  fuelRequired: number;
  tags?: string[];
  bannerUrl?: string;
  posterUrl?: string;
  currency?: string;
  maxSubmissions?: number;
  isActive?: boolean;
  endsInDays?: number;
}
```

### PhotoVerificationResult
```typescript
interface PhotoVerificationResult {
  success: boolean;
  message?: string;
  data?: any;
}
```

### Campaign
```typescript
interface Campaign {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  latitude: number;
  longitude: number;
  radius: number;
  totalRewards: number;
  rewardPerTask: number;
  fuelRequired: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  photos?: string[];
}
```

### Balance
```typescript
interface Balance {
  points: number;
  fuel: number;
}
```

## Error Codes

The adapter may throw `WitnesschainError` with the following error codes:

- `INVALID_PRIVATE_KEY`: Invalid Ethereum private key provided
- `NO_WALLET`: Wallet not initialized (missing private key)
- `FILE_NOT_FOUND`: Image file not found
- `FILE_TOO_LARGE`: Image file exceeds size limit
- `VERIFICATION_FAILED`: Photo verification failed
- `API_ERROR`: General API error
- `REQUEST_FAILED`: Network request failed
- `SIGNING_FAILED`: Message signing failed
- `AUTH_FAILED`: Authentication failed

## License

MIT 