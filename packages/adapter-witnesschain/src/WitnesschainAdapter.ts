import axios, { AxiosResponse } from 'axios';
import * as fs from "fs";
import * as path from "path";
import FormData from 'form-data';
import { Wallet } from "ethers";

export interface WitnesschainConfig {
  apiUrl?: string;
  blockchainApiUrl?: string;
  privateKey?: string;
}

export interface CampaignCreateParams {
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

export interface PhotoVerificationResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface Campaign {
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

export interface Balance {
  points: number;
  fuel: number;
}

export class WitnesschainError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'WitnesschainError';
  }
}

/**
 * WitnesschainAdapter - A class for verifying photos and interacting with the Witnesschain API.
 */
export class WitnesschainAdapter {
  private apiUrl: string;
  private blockchainApiUrl: string;
  private wallet: Wallet | null;
  private cookies: string;

  constructor(config: WitnesschainConfig = {}) {
    this.apiUrl = config.apiUrl ?? "http://localhost:8000/verify-photos/";
    this.blockchainApiUrl = config.blockchainApiUrl ?? "https://testnet.witnesschain.com/proof/v1/pol";
    this.cookies = "";

    if (config.privateKey) {
      try {
        this.wallet = new Wallet(config.privateKey);
      } catch (error) {
        throw new WitnesschainError('Invalid private key provided', 'INVALID_PRIVATE_KEY');
      }
    } else {
      console.warn("No private key provided. Some functionality will be limited.");
      this.wallet = null;
    }
  }

  /**
   * Verifies a list of images for a given task.
   * @throws {WitnesschainError} If there's an error during verification
   */
  async verifyPhotos(imagePaths: string[], task: string): Promise<PhotoVerificationResult> {
    const formData = new FormData();

    try {
      for (const imgPath of imagePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new WitnesschainError(`Image file not found: ${imgPath}`, 'FILE_NOT_FOUND');
        }
        const fileStats = fs.statSync(imgPath);
        if (fileStats.size > 10 * 1024 * 1024) { // 10MB limit
          throw new WitnesschainError(`File too large: ${imgPath}`, 'FILE_TOO_LARGE');
        }
        formData.append("photos", fs.createReadStream(imgPath), {
          filename: path.basename(imgPath),
          contentType: "image/jpeg",
        });
      }

      formData.append("task", task);

      const response = await axios.post(this.apiUrl, formData, {
        headers: { ...formData.getHeaders() },
      });

      return {
        success: response.status === 200,
        data: response.data
      };
    } catch (error: any) {
      if (error instanceof WitnesschainError) {
        throw error;
      }
      throw new WitnesschainError(
        error.message,
        'VERIFICATION_FAILED',
        error.response?.data
      );
    }
  }

  /**
   * Makes a POST request to the Witnesschain API.
   */
  private async doPost<T>(api: string, data: object): Promise<T> {
    try {
      const response = await axios.post(`${this.blockchainApiUrl}/${api}`, data, {
        headers: { 
          "Content-Type": "application/json", 
          "Cookie": this.cookies,
          "User-Agent": "@eigenlayer/agentkit-witness"
        },
      });

      const allCookies = response.headers['set-cookie'] ?? [];
      let newCookies = "";
      let updateCookie = false;

      for (const cookie of allCookies) {
        if (cookie.startsWith("__")) {
          updateCookie = true;
        }
        newCookies += cookie.split(";")[0] + "; ";
      }

      if (updateCookie) {
        this.cookies = newCookies;
      }

      if (response.status === 200) {
        return response.data.result;
      }
      throw new WitnesschainError('Request failed', 'API_ERROR', response.data);
    } catch (error: any) {
      if (error instanceof WitnesschainError) {
        throw error;
      }
      throw new WitnesschainError(
        'API request failed',
        'REQUEST_FAILED',
        error.response?.data || error.message
      );
    }
  }

  /**
   * Signs a message using the Ethereum wallet.
   */
  private async signMessage(msg: string): Promise<string> {
    if (!this.wallet) {
      throw new WitnesschainError('Wallet is not initialized', 'NO_WALLET');
    }
    try {
      return await this.wallet.signMessage(msg);
    } catch (error: any) {
      throw new WitnesschainError('Failed to sign message', 'SIGNING_FAILED', error.message);
    }
  }

  /**
   * Authenticates with the Witnesschain service.
   * @throws {WitnesschainError} If authentication fails
   */
  async authenticate(latitude: number, longitude: number): Promise<boolean> {
    if (!this.wallet) {
      throw new WitnesschainError('No wallet available for authentication', 'NO_WALLET');
    }

    try {
      const preLoginResponse = await this.doPost<{ message: string }>('pre-login', {
        keyType: "ethereum",
        publicKey: this.wallet.address,
        clientVersion: "9999999999",
        walletPublicKey: { ethereum: this.wallet.address },
        role: "prover",
        claims: { latitude, longitude },
      });

      const signature = await this.signMessage(preLoginResponse.message);
      const loginResponse = await this.doPost<boolean>('login', { signature });

      return loginResponse;
    } catch (error) {
      if (error instanceof WitnesschainError) {
        throw error;
      }
      throw new WitnesschainError('Authentication failed', 'AUTH_FAILED');
    }
  }

  /**
   * Gets the account balance.
   * @throws {WitnesschainError} If balance retrieval fails
   */
  async getBalance(): Promise<Balance> {
    return this.doPost<Balance>('my-balance', {});
  }

  /**
   * Gets all available campaigns.
   * @throws {WitnesschainError} If campaign retrieval fails
   */
  async getCampaigns(): Promise<Campaign[]> {
    return this.doPost<Campaign[]>('all-campaigns', {});
  }

  /**
   * Gets photos from a specific campaign.
   * @throws {WitnesschainError} If photo retrieval fails
   */
  async getCampaignPhotos(campaign: string, since: string | null = null): Promise<string[]> {
    return this.doPost<string[]>('photo-feed-from-campaign', { campaign, since });
  }

  /**
   * Accepts a verified photo for rewards.
   * @throws {WitnesschainError} If photo acceptance fails
   */
  async acceptPhoto(photo: string): Promise<boolean> {
    return this.doPost<boolean>('accept-photo', { photo });
  }

  /**
   * Creates a new campaign.
   * @throws {WitnesschainError} If campaign creation fails
   */
  async createCampaign(params: CampaignCreateParams): Promise<Campaign> {
    const now = new Date().toISOString();
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + (params.endsInDays ?? 10));

    const payload = {
      campaign: params.campaignName,
      description: params.description,
      type: "individual",
      tags: params.tags ?? ["campaign"],
      created_by: params.createdBy,
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius,
      banner_url: params.bannerUrl ?? "https://www.google.com/x.png",
      poster_url: params.posterUrl ?? "https://www.google.com/x.png",
      currency: params.currency ?? "POINTS",
      total_rewards: params.totalRewards,
      reward_per_task: params.rewardPerTask,
      fuel_required: params.fuelRequired,
      starts_at: now,
      ends_at: endTime.toISOString(),
      max_submissions: params.maxSubmissions ?? 10000,
      is_active: params.isActive ?? false,
    };

    return this.doPost<Campaign>('create-campaign', payload);
  }
} 