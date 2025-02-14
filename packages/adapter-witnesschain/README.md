# **@layr-labs/agentkit-witnesschain**

## 📌 Overview
The **Witnesschain Adapter** is a TypeScript-based utility that enables an agent to request tasks and observations in the real world. It works in conjunction with the **InfinityWatch app**, which acts as a portal to the physical world.

This utility operates in **three steps** by sending requests to WitnessChain's API:

✅ **Step 1**: Create a **campaign** (a request for specific real-world observations). Campaigns appear in the **InfinityWatch app** for users to participate.  
✅ **Step 2**: Fetch **geoverified observations** (e.g., images, videos, location data) submitted by users.  
✅ **Step 3**: Classify the received geoverified images to verify whether they correspond to the requested task.  

### **Installation**
```bash
npm install @layr-labs/agentkit-witnesschain
# or
yarn add @layr-labs/agentkit-witnesschain
# or
pnpm add @layr-labs/agentkit-witnesschain
```

---

## 🚀 Features
- **Request real-world actions** at specific locations
- **Retrieve real-world data and observations** with geoverification
- **Byzantine-resistant Proof of Location (PoL)** for trustless verification
- **Global coverage** through a decentralized PoL watchtower network
- **Blockchain-based verification** ensures authenticity
- **Manage campaigns** via the **InfinityWatch app**

---

## 🔧 Configuration

### **Environment Variables**

Create a `.env` file with the following variables:
```env
WITNESSCHAIN_API_KEY=your_api_key
WITNESSCHAIN_API_URL=https://api.witnesschain.com  # Optional: defaults to mainnet
WITNESSCHAIN_PRIVATE_KEY=your_private_key  # For submitting proofs
```

### **Creating an API endpoint for verification**
Refer to "https://github.com/witnesschain-com/photo-verification-api.git" for instructions on running a verification endpoint. This will need to be passed to the WitnesschainAdapter Constructor's first argument.

---

## 📖 Usage

### **Import and Initialize the Adapter**
```typescript
import { WitnesschainAdapter } from "witnesschain-adapter";

const adapter = new WitnesschainAdapter();
```

### **Login with Ethereum-compatible Wallet**
```sh
export WITNESSCHAIN_PRIVATE_KEY="<Your-Private-Key>"
```
```typescript
const privateKey = process.env.WITNESSCHAIN_PRIVATE_KEY; 
const logged_in = await adapter.login(privateKey);
```

### **Create a Blockchain Campaign**
```typescript
const response = await adapter.createCampaign({
  campaign: "MY_CAMPAIGN",
  description: "My campaign description",
  type: "individual", // Options: "group", "individual", "task"
  latitude: 12.9,
  longitude: 77.5,
  radius: 100, // Radius in kilometers
  banner_url: "https://example.com/banner.png",
  poster_url: "https://example.com/poster.png",
  currency: "POINTS",
  total_rewards: 10.0,
  reward_per_task: 2.0,
  fuel_required: 1.0,
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  max_submissions: 10000,
  is_active: true,
});
```

### **Classify Images**
To classify a set of images for a specific task:
```typescript
const imagePaths = ["IMG_1347.jpeg", "IMG_1348.jpeg"];
const task = "Reduce electricity consumption";

adapter.classifyPhotos(imagePaths, task)
  .then(response => {
    console.log("Verification Response:", response.data);
  })
  .catch(error => {
    console.error("Error classifying photos:", error);
  });
```

---

## 📚 API Reference

### **Class: `WitnesschainAdapter`**
The main adapter class for interacting with WitnessChain's API.

#### **Constructor**
```typescript
constructor(apiUrl?: string, blockchainApiUrl?: string)
```
- **`apiUrl`** *(optional)*: The endpoint to send image verification requests (default: `http://localhost:8000/classify-photos/`).
- **`blockchainApiUrl`** *(optional)*: The Witnesschain blockchain API endpoint (default: `https://testnet.witnesschain.com/proof/v1/pol`).

#### **Method: `login(privateKey: string)`**
```typescript
login(privateKey: string): Promise<boolean>
```
- **`privateKey`** *(string)*: The Ethereum private key for authentication.
- **Returns**: `Promise<boolean>` – `true` if login is successful, `false` otherwise.

#### **Method: `createCampaign(...)`**
```typescript
createCampaign(payload: object): Promise<any>
```
- **Parameters**: An object containing campaign details.
- **Returns**: A response object containing campaign data.

#### **Method: `classifyPhotos(imagePaths: string[], task: string)`**
```typescript
classifyPhotos(imagePaths: string[], task: string): Promise<AxiosResponse | null>
```
- **`imagePaths`** *(string array)*: Paths to images that need classification.
- **`task`** *(string)*: The task description.
- **Returns**: `Promise<AxiosResponse | null>` – API response or `null` if an error occurs.

---

## ⚠️ Error Handling

The adapter uses structured error handling with **custom error classes**:

### **Error Types**
- **`WitnesschainError`**: Base error class for all WitnessChain errors.
- **`NetworkError`**: Raised when there is a network failure or unreachable API.
- **`APIError`**: Raised when the API responds with an error code (e.g., 400, 500).
- **`AuthenticationError`**: Raised for authentication failures (e.g., invalid private key).

### **Example: Handling Errors**
```typescript
try {
  const balance = await adapter.getBalance();
  console.log("Balance:", balance);
} catch (error) {
  if (error instanceof NetworkError) {
    console.error("Network issue! Please check your connection.");
  } else if (error instanceof APIError) {
    console.error("API responded with an error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

---

## 🤝 Contributing
Please read the **contributing guidelines** in the root of the monorepo for details on our **code of conduct** and how to submit pull requests.

---

## 📜 License
MIT License - see the **LICENSE** file for details.

---

## 👨‍💻 Author
Developed by **Witnesschain**.
