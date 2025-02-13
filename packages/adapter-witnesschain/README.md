# Witnesschain Adapter

## 📌 Overview
The **Witnesschain Adapter** is a TypeScript-based utility that enables image verification and blockchain-based campaign creation by sending requests to an API. It handles file uploads using `axios` and `form-data`, and integrates Ethereum-based authentication using `ethers`.

## 🚀 Features
- 📷 Upload multiple images for verification
- ⚡ Uses `axios` for efficient HTTP requests
- 💤 Handles file streams properly to prevent memory overload
- 🛠️ TypeScript support for better development experience
- 🔑 Ethereum-based authentication using private keys
- 🏛️ Create and manage blockchain campaigns

## 🛠️ Usage

### **Import and Initialize the Adapter**
```typescript
import { WitnesschainAdapter } from "witnesschain-adapter";

const adapter = new WitnesschainAdapter();
```

### **Authenticate with Ethereum Wallet**
```sh
export WITNESSCHAIN_PRIVATE_KEY="<Your-Private-Key>"
```

```typescript
const privateKey = process.env.WITNESSCHAIN_PRIVATE_KEY; 
const latitude = 12.9;
const longitude = 77.5;

const logged_in = await adapter.authenticate(privateKey, latitude, longitude);
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

## 📚 Class Documentation

### **`WitnesschainAdapter`**
The main adapter class for verifying images and interacting with the blockchain.

#### **Constructor**
```typescript
constructor(apiUrl: string = "http://localhost:8000/verify-photos/", blockchainApiUrl: string = "https://testnet.witnesschain.com/proof/v1/pol")
```
- **`apiUrl`** *(optional)*: The endpoint to send image verification requests (default: `http://localhost:8000/verify-photos/`).
- **`blockchainApiUrl`** *(optional)*: The Witnesschain blockchain API endpoint (default: `https://testnet.witnesschain.com/proof/v1/pol`).

#### **Method: `authenticate(privateKey: string, latitude: number, longitude: number)`**
```typescript
authenticate(privateKey: string, latitude: number, longitude: number): Promise<boolean>
```
- **`privateKey`** *(string)*: The Ethereum private key for authentication.
- **`latitude`**, **`longitude`** *(number)*: User’s geographical location.
- **Returns**: `Promise<boolean>` – `true` if authentication is successful, `false` otherwise.

#### **Method: `createCampaign(...)`**
```typescript
createCampaign(privateKey: string, campaignName: string, description: string, createdBy: string, latitude: number, longitude: number, radius: number, totalRewards: number, rewardPerTask: number, fuelRequired: number): Promise<any>
```
- **Parameters**: Customizable campaign details.
- **Returns**: Campaign creation response.

#### **Method: `verifyPhotos(imagePaths: string[], task: string)`**
```typescript
verifyPhotos(imagePaths: string[], task: string): Promise<AxiosResponse | null>
```
- **`imagePaths`** *(string array)*: Paths to images that need verification.
- **`task`** *(string)*: The task description (e.g., `"Reduce electricity consumption"`).
- **Returns**: `Promise<AxiosResponse | null>` – API response or `null` if an error occurs.

---

## 📺 Project Structure
```
witnesschain-adapter/
├── src/
│   ├── index.ts
│   ├── WitnesschainAdapter.ts
├── dist/               # Compiled JavaScript files
├── package.json
├── tsconfig.json       # TypeScript configuration
├── .gitignore
├── README.md
```

---

## ❓ Troubleshooting
### **1. TypeScript Error: `esModuleInterop`**
If you see this error:
```
Module 'form-data' can only be default-imported using the 'esModuleInterop' flag
```
Enable **`esModuleInterop`** in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "esModuleInterop": true
  }
}
```
Then recompile:
```sh
npm install
npm run build
```

### **2. Missing Dependencies**
Ensure all dependencies are installed:
```sh
npm install
```

---

## 💜 License
This project is licensed under the **MIT License**.

---

## 👨‍💻 Author
Developed by **Witnesschain**.

For inquiries or contributions, feel free to open an issue! 🚀

