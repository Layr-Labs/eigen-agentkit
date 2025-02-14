import axios, { AxiosResponse } from "axios";
import * as fs from "fs";
import * as path from "path";
import FormData from "form-data";
import * as ethers from "ethers";
import { WitnesschainError, APIError, NetworkError } from "./errorHandler";

export class WitnesschainAdapter {
  private apiUrl: string;
  private blockchainApiUrl: string;
  private wallet;
  private cookies: string;

  constructor(
    apiUrl: string = "http://localhost:8000/classify-photos/",
    blockchainApiUrl: string = "https://testnet.witnesschain.com/proof/v1/pol",
    privateKey: string = ""
  ) {
    this.apiUrl = apiUrl;
    this.blockchainApiUrl = blockchainApiUrl;
    this.wallet = privateKey ? new ethers.Wallet(privateKey) : null;
    this.cookies = "";

    if (!privateKey) {
      console.error("'privateKey' is not defined!");
    }
  }

  async doPost(api: string, data: object): Promise<any> {
    try {
      const response = await axios.post(`${this.blockchainApiUrl}/${api}`, data, {
        headers: { "Content-Type": "application/json", "Cookie": this.cookies },
        timeout: 10000,
      });

      if (response.status === 200) {
        return response.data.result;
      } else {
        throw new APIError(response.status, response.statusText);
      }
    } catch (error: any) {
      if (!error.response) throw new NetworkError();
      throw new APIError(error.response.status, error.response.statusText);
    }
  }

  async classifyPhotos(imagePaths: string[], task: string): Promise<any> {
    if (!imagePaths.length) {
      throw new WitnesschainError("At least one image path must be provided.");
    }

    const formData = new FormData();
    try {
      for (const imgPath of imagePaths) {
        if (!fs.existsSync(imgPath)) {
          throw new WitnesschainError(`Image file not found: ${imgPath}`);
        }
        formData.append("photos", fs.createReadStream(imgPath), {
          filename: path.basename(imgPath),
          contentType: "image/jpeg",
        });
      }
      formData.append("task", task);
      const response = await axios.post(this.apiUrl, formData, { headers: formData.getHeaders() });

      return response.data;
    } catch (error: any) {
      throw new WitnesschainError(error.message);
    }
  }

  async login(): Promise<boolean> {
    if (!this.wallet) {
      throw new WitnesschainError("Wallet is not initialized.");
    }

    const preLoginResponse = await this.doPost("pre-login", {
      keyType: "ethereum",
      publicKey: this.wallet.address,
      clientVersion: "9999999999",
      walletPublicKey: { ethereum: this.wallet.address },
      role: "payer",
      claims: {},
    });

    if (!preLoginResponse) return false;

    const signature = await this.wallet.signMessage(preLoginResponse["message"]);
    const loginResponse = await this.doPost("login", { signature });

    return loginResponse !== null;
  }

  async getBalance(): Promise<any> {
    return await this.doPost("my-balance", {});
  }

  async getCampaigns(): Promise<any> {
    return await this.doPost("all-campaigns", {});
  }

  async acceptPhoto(photo: string): Promise<boolean> {
    if (!photo) {
      throw new WitnesschainError("Photo ID is required.");
    }
    return await this.doPost("accept-photo", { photo });
  }

  async getCampaignPhotos(campaign: string, since: string | null): Promise<any> {
    if (!campaign) {
      throw new WitnesschainError("Campaign ID is required.");
    }
    return await this.doPost("photo-feed-from-campaign", { campaign, since });
  }

  async createCampaign(payload: any): Promise<any> {
    return await this.doPost("create-campaign", payload);
  }
}
