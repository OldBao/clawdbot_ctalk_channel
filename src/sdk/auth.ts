import axios from 'axios';
import { SeaTalkConfig, AccessTokenResponse, ApiResponse } from './types';

export class SeaTalkAuth {
  private config: SeaTalkConfig;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl: string;

  constructor(config: SeaTalkConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://openapi.seatalk.io';
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if still valid (with 5 min buffer)
    if (this.cachedToken && this.tokenExpiry > now + 300000) {
      return this.cachedToken;
    }

    try {
      const response = await axios.post<ApiResponse<AccessTokenResponse>>(
        `${this.baseUrl}/v1/auth/token`,
        {
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        }
      );

      const { data } = response.data;
      if (!data) {
        throw new Error('No token data received');
      }

      this.cachedToken = data.access_token;
      this.tokenExpiry = now + (data.expires_in * 1000);

      return this.cachedToken;
    } catch (error) {
      this.cachedToken = null;
      this.tokenExpiry = 0;
      throw error;
    }
  }

  getSigningSecret(): string {
    return this.config.signingSecret;
  }
}
