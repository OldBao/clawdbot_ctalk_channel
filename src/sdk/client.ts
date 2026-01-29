import axios from 'axios';
import { SeaTalkAuth } from './auth';
import {
  SeaTalkConfig,
  SendMessageRequest,
  SendMessageResponse,
  ApiResponse
} from './types';

export class SeaTalkClient {
  private auth: SeaTalkAuth;
  private baseUrl: string;

  constructor(config: SeaTalkConfig) {
    this.auth = new SeaTalkAuth(config);
    this.baseUrl = config.baseUrl || 'https://openapi.seatalk.io';
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!request.email && !request.emails) {
      throw new Error('Either email or emails must be provided');
    }

    const token = await this.auth.getAccessToken();

    const response = await axios.post<ApiResponse<SendMessageResponse>>(
      `${this.baseUrl}/v1/bot/message/send`,
      {
        ...(request.email ? { email: request.email } : {}),
        ...(request.emails ? { emails: request.emails } : {}),
        message: request.message
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.data) {
      throw new Error(`Failed to send message: ${response.data.message}`);
    }

    return response.data.data;
  }
}
