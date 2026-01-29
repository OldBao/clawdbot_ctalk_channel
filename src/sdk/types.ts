export interface SeaTalkConfig {
  appId: string;
  appSecret: string;
  signingSecret: string;
  baseUrl?: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SeaTalkError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}
