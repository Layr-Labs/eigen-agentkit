# @layr-labs/agentkit-witnesschain

## 📌 Overview
The **Witnesschain Adapter** is a TypeScript-based utility that enables an agent to request tasks and observations in the real physical world. This utility works in conjunction with the InfinityWatch app - that acts as a portal to the real world. 

The utility operates in 3 steps by sending requests to WitnessChain's API. 
- Step 1: Create a "campaign" - a specific action/observation to be requested from the InfinityWatch app. A campaign created here will show up on the app for all users (campaigns can be created by AI agents or manually)
- Step 2: Fetch all geoverified observations made on the InfinityWatch app tied to your campaign and
- Step 3: Classify if those geoverified images correspond to the task/observation the campaign requested. 

```bash
npm install @layr-labs/agentkit-witnesschain
# or
yarn add @layr-labs/agentkit-witnesschain
# or
pnpm add @layr-labs/agentkit-witnesschain
```

## 🚀 Features
- Request real-world actions at specific locations
- Request real-world data/observation at specific locations
- Verified location claims with byzantine resistance powered by Proof of Location
- Global coverage through decentralized PoL watchtower network
- Blockchain-based verification for trustless operation
- Campaign management interfaced through InfinityWatch app
Emojis TBD
  
## Configuration

### Environment Variables

```env
WITNESSCHAIN_API_KEY=your_api_key
WITNESSCHAIN_API_URL=https://api.witnesschain.com  # Optional: defaults to mainnet
WITNESSCHAIN_PRIVATE_KEY=your_private_key  # For submitting proofs
```

## Usage

### **Import and Initialize the Adapter**
```typescript
import { WitnesschainAdapter } from "witnesschain-adapter";

const adapter = new WitnesschainAdapter();
```

### **Login with Ethereum compatible Wallet**
```sh
export WITNESSCHAIN_PRIVATE_KEY="<Your-Private-Key>"
```

```typescript
const privateKey = process.env.WITNESSCHAIN_PRIVATE_KEY; 
const latitude = 12.9;
const longitude = 77.5;

const logged_in = await adapter.login(privateKey);
```

### **Create a Blockchain Campaign**
```typescript
const r = await witnesschain_client.createCampaign ({
	campaign			: MY_CAMPAIGN,
	description			: "my-campaign-description",
	type				: "individual",	// "group", "individual", OR "task"

	// ---- Group campaigns may require 2 values ---
	// location_limit_in_meters	: 100,		// how far can people in a group can be
	// time_limit_in_minutes	: 60,		// how long the referral link is valid

	tags			: [
		"campaign",
		"tags"
	],

	// lat, long, and radius is not mandatory
	latitude		: LONGITUDE,
	longitude		: LATITUDE,
	radius			: 100, // in kms the radius of circle within which the campaign is valid

	banner_url		: "https://www.google.com/x.png",	// images shown to user 
	poster_url		: "https://www.google.com/x.png",

	currency		: "POINTS",	// What currency will be rewarded to participants
	total_rewards		: 10.0,		// The MAX/total rewards the campaign can give
	reward_per_task		: 2.0,		// rewards per task
	fuel_required		: 1.0,		// Fuel that will be spent by the user for this task

	starts_at		: starts_at,	//  When campaign starts and ends
	ends_at			: ends_at,

	max_submissions		: 10000,// Max submissions that this campaign can accept

	is_active		: true	// true makes it immediately available to all users
});
```

### **Example scripts**
```
cd adapter-witnesschain
export WITNESSCHAIN_PRIVATE_KEY="<Your-Private-Key>"
npm install
npm run build
node dist/examples/campaign.js
```


### **Verify Images**
To verify a set of images for a specific task:

```typescript
const imagePaths = ["IMG_1347.jpeg", "IMG_1348.jpeg"];
const task = "Reduce electricity consumption";

adapter.verifyPhotos(imagePaths, task)
  .then(response => {
    console.log("Verification Response:", response.data);
  })
  .catch(error => {
    console.error("Error verifying photos:", error);
  });
```

---

## API Reference

## 📚 Class Documentation

### **`WitnesschainAdapter`**
The adapter class for requesting and receiving geoverified real-world observations via WitnessChain's InfinityWatch.

#### **Constructor**
```typescript
constructor(apiUrl: string = "http://localhost:8000/verify-photos/", blockchainApiUrl: string = "https://testnet.witnesschain.com/proof/v1/pol")
```
- **`apiUrl`** *(optional)*: The endpoint to send image verification requests (default: `http://localhost:8000/verify-photos/`).
- **`blockchainApiUrl`** *(optional)*: The Witnesschain blockchain API endpoint (default: `https://testnet.witnesschain.com/proof/v1/pol`).

#### **Method: `login(privateKey: string)`**
```typescript
login(privateKey: string): Promise<boolean>
```
- **`privateKey`** *(string)*: The Ethereum private key for authentication.
- **Returns**: `Promise<boolean>` – `true` if login is successful, `false` otherwise.

#### **Method: `createCampaign(...)`**
```typescript
createCampaign(privateKey: string, campaignName: string, description: string, createdBy: string, latitude: number, longitude: number, radius: number, totalRewards: number, rewardPerTask: number, fuelRequired: number): Promise<any>
```
- **Parameters**: Customizable campaign details.
- **Returns**: Campaign creation response.

#### **Method: `classifyPhotos(imagePaths: string[], task: string)`**
```typescript
classifyPhotos(imagePaths: string[], task: string): Promise<AxiosResponse | null>
```
- **`imagePaths`** *(string array)*: Paths to images that need classification.
- **`task`** *(string)*: The task description (e.g., `"Reduce electricity consumption"`).
- **Returns**: `Promise<AxiosResponse | null>` – API response or `null` if an error occurs.

---




## Types

-- TBD

## Error Handling

The adapter throws the following error types:
TBD 

## Contributing

Please read the contributing guidelines in the root of the monorepo for details on our code of conduct and the process for submitting pull requests.

## License

MIT License - see the LICENSE file for details.

## 👨‍💻 Author
Developed by **Witnesschain**.

