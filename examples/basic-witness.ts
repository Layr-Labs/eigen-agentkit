import { WitnesschainAdapter } from "../packages/adapter-witnesschain/src/WitnesschainAdapter";
import dotenv from "dotenv";
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

dotenv.config();

// Helper function to download test images
async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await axios({
    url,
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function main() {
  // Initialize the Witnesschain adapter
  const witnessAdapter = new WitnesschainAdapter({
    privateKey: process.env.WITNESS_PRIVATE_KEY,
    apiUrl: process.env.WITNESS_API_URL,
    blockchainApiUrl: process.env.WITNESS_BLOCKCHAIN_API_URL,
  });

  try {
    // Authenticate with the service
    console.log("Authenticating with Witnesschain...");
    const authenticated = await witnessAdapter.authenticate(37.7749, -122.4194);
    
    if (!authenticated) {
      console.error("Authentication failed");
      process.exit(1);
    }
    console.log("Authentication successful");

    // Get balance
    console.log("\nChecking balance...");
    const balance = await witnessAdapter.getBalance();
    console.log("Current balance:", balance);

    // Get available campaigns
    console.log("\nFetching available campaigns...");
    const campaigns = await witnessAdapter.getCampaigns();
    console.log(`Found ${campaigns.length} campaigns`);

    // Create a new campaign with more options
    console.log("\nCreating a new campaign...");
    const start = new Date();
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 7);

    const newCampaign = await witnessAdapter.createCampaign({
      campaignName: "Test Campaign",
      description: "A test campaign created via AgentKit",
      createdBy: "AgentKit Example",
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 5,
      totalRewards: 1000,
      rewardPerTask: 10,
      fuelRequired: 1,
      tags: ["test", "example"],
      isActive: true,
      endsInDays: 7,
      currency: "POINTS",
      maxSubmissions: 10000,
      bannerUrl: "https://example.com/banner.jpg",
      posterUrl: "https://example.com/poster.jpg"
    });
    console.log("Created campaign:", newCampaign.name);

    // Download and verify test photos
    console.log("\nDownloading test photos...");
    const testPhotoUrl = "https://example.com/test.jpg"; // Replace with actual test photo URL
    const photoPath = path.join(__dirname, "test-photo.jpg");
    await downloadImage(testPhotoUrl, photoPath);

    // Verify photos
    console.log("\nVerifying photos...");
    const verificationResult = await witnessAdapter.verifyPhotos(
      [photoPath],
      "Verify this location"
    );
    console.log("Verification result:", verificationResult);

    if (verificationResult.success) {
      // Get photos from the campaign
      console.log("\nFetching campaign photos...");
      const photos = await witnessAdapter.getCampaignPhotos(newCampaign.id);
      console.log(`Found ${photos.length} photos in campaign`);

      // Accept verified photos
      if (photos.length > 0) {
        console.log("\nAccepting verified photo...");
        const accepted = await witnessAdapter.acceptPhoto(photos[0]);
        console.log("Photo accepted:", accepted);
      }
    }

  } catch (error) {
    console.error("Error in example:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
}); 