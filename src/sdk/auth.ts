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
      const response = await axios.post<ApiResponse<AccessTokenResponse> | AccessTokenResponse>(
        `${this.baseUrl}/auth/app_access_token`,
        {
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        }
      );

      const payload = response.data as any;
      const data = payload?.data ? payload.data : payload;

      const token = data?.app_access_token || data?.access_token;
      if (!token) {
        throw new Error('No token data received');
      }

      this.cachedToken = token;

      if (typeof data?.expire === 'number') {
        this.tokenExpiry = data.expire * 1000;
      } else if (typeof data?.expires_in === 'number') {
        this.tokenExpiry = now + (data.expires_in * 1000);
      } else {
        // Fallback cache TTL if API omits expiry fields.
        this.tokenExpiry = now + 3600 * 1000;
      }

      return token;
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
