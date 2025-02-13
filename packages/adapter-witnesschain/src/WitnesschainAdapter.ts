import axios from 'axios';
import { AxiosResponse } from 'axios';

import * as fs from "fs";
import * as path from "path";
import FormData from 'form-data';
import * as ethers from "ethers";

/**
 * Witnesschain Adapter - A class for verifying photos and interacting with the Witnesschain API.
 */
export class WitnesschainAdapter {
  private apiUrl: string;
  private blockchainApiUrl: string;
  private wallet;
  private cookies;

  constructor(
    apiUrl: string = "http://localhost:8000/verify-photos/",
    blockchainApiUrl: string = "https://testnet.witnesschain.com/proof/v1/pol",
    privateKey : string = ""
  ) {
    this.apiUrl = apiUrl;
    this.blockchainApiUrl = blockchainApiUrl;

    if (privateKey)
    {
        this.wallet = new ethers.Wallet(privateKey);
    }
    else
    {
        console.error("'privateKey' is not defined!")
        this.wallet = null;
    }

    this.cookies = "";
  }

  /**
   * Verifies a list of images for a given task.
   * @param imagePaths Array of image file paths
   * @param task Task description for verification
   * @returns API response or null in case of failure
   */
  async verifyPhotos(imagePaths: string[], task: string): Promise<AxiosResponse | null> {
    const formData = new FormData();

    try {
      for (const imgPath of imagePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new Error(`Image file not found: ${imgPath}`);
        }
        formData.append("photos", fs.createReadStream(imgPath), {
          filename: path.basename(imgPath),
          contentType: "image/jpeg",
        });
      }

      formData.append("task", task);

      console.log(`Making request to ${this.apiUrl}`);
      console.log("Files being sent:", imagePaths);
      console.log("Data being sent:", { task });

      const response = await axios.post(this.apiUrl, formData, {
        headers: { ...formData.getHeaders() },
      });

      console.log("\nResponse Status Code:", response.status);
      console.log("Response Content:", response.data);

      return response;
    } catch (error: any) {
      console.error("Error:", error.message);
      return null;
    }
  }

  /**
   * Performs a POST request to the Witnesschain API.
   * @param api API endpoint
   * @param data Payload to send
   * @returns API response data or null
   */
  async doPost(api: string, data: object): Promise<any> {
    try {
      const response = await axios.post(`${this.blockchainApiUrl}/${api}`, data, {
        headers: { "Content-Type": "application/json", "Cookie" : this.cookies},
      });

      const all_cookies = response.headers['set-cookie'] ?? [];

      let got_cookies	= "";
      let update_cookie	= false;

      for (const c of all_cookies)
      {
         if (c.startsWith("__"))
		update_cookie = true;

         got_cookies += c.split(";")[0] + "; ";
      }

      if (update_cookie)
	      this.cookies = got_cookies;

      if (response.status === 200) {
        console.log("✅ SUCCESS", response.config.url);
        return response.data.result;
      } else {
        console.log("❌ FAILURE", response.status, response.config.url);
        return null;
      }
    } catch (error: any) {
      console.error("Request Error:", error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Signs a message using an Ethereum private key.
   * @param msg Message to sign
   * @returns Signed message
   */
  async signMessage(msg: string): Promise<string> {

    if (!this.wallet) {
        throw new Error("Wallet is not initialized. Ensure authentication is successful.");
      }

	const signature    = await this.wallet.signMessage(msg);
	const signatureHex = ethers.hexlify(ethers.getBytes(signature));

	return signatureHex;
  }

  /**
   * Logs into Witnesschain using an Ethereum wallet signature.
   * @param privateKey Ethereum private key
   * @param latitude User latitude
   * @param longitude User longitude
   * @returns True if authentication is successful, otherwise false
   */
  async login(): Promise<boolean> {

    if (! this.wallet)
       return false;

    const address = this.wallet?.address;

    const preLoginResponse = await this.doPost("pre-login", {
      keyType: "ethereum",
      publicKey: address,
      clientVersion: "9999999999",
      walletPublicKey: { ethereum: address },
      role: "payer",
      claims: {},
    });

    if (!preLoginResponse) return false;

    const signature = await this.signMessage(preLoginResponse["message"]);

    const loginResponse = await this.doPost("login", {
      signature: signature,
    });

    return loginResponse !== null;
  }

  /**
   * Fetches the account balance from Witnesschain.
   * @returns Account balance
   */
  async getBalance(): Promise<any> {
    return await this.doPost("my-balance", {});
  }

  /**
   * Fetches the list of available campaigns from Witnesschain.
   * @returns List of campaigns
   */
  async getCampaigns(): Promise<any> {
    return await this.doPost("all-campaigns", {});
  }

  async createCampaign(campaign_data : any): Promise<any> {
    return await this.doPost("create-campaign", campaign_data);
  }

  /**
   * Accepts a photo after verification for rewards 
   * @returns true/false 
   */
  async acceptPhoto(photo : string): Promise<boolean> {
    return await this.doPost("accept-photo", {"photo":photo});
  }

  /**
   * Fetches the list of photos from a campaign from Witnesschain.
   * @returns List of photos
   */
  async getCampaignPhotos(campaign : string, since : string | null): Promise<any> {
    return await this.doPost("photo-feed-from-campaign", {"campaign":campaign, "since" : since});
  }

  /**
   * Creates a new campaign on Witnesschain.
   * @param privateKey Ethereum private key
   * @param campaignName Campaign name
   * @param description Campaign description
   * @param createdBy Creator’s name or handle
   * @param latitude Campaign latitude
   * @param longitude Campaign longitude
   * @param radius Campaign radius (in km)
   * @param totalRewards Total reward pool
   * @param rewardPerTask Reward per completed task
   * @param fuelRequired Fuel needed for participation
   * @returns Campaign creation response
   */
  async _createCampaign(
    privateKey: string,
    campaignName: string,
    description: string,
    createdBy: string,
    latitude: number,
    longitude: number,
    radius: number,
    totalRewards: number,
    rewardPerTask: number,
    fuelRequired: number
  ): Promise<any> {
    const now = new Date().toISOString();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 10);

    const payload = {
      campaign: campaignName,
      description: description,
      type: "individual",
      tags: ["campaign", "tags"],
      created_by: createdBy,
      latitude: latitude,
      longitude: longitude,
      radius: radius,
      banner_url: "https://www.google.com/x.png",
      poster_url: "https://www.google.com/x.png",
      currency: "POINTS",
      total_rewards: totalRewards,
      reward_per_task: rewardPerTask,
      fuel_required: fuelRequired,
      starts_at: now,
      ends_at: endTime.toISOString(),
      max_submissions: 10000,
      is_active: false,
    };

    return await this.doPost("create-campaign", payload);
  }
}


