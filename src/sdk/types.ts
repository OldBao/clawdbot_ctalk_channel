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

export interface TextMessage {
  tag: 'text';
  text: {
    content: string;
  };
}

export interface ImageMessage {
  tag: 'image';
  image: {
    image_url: string;
  };
}

export type MessageContent = TextMessage | ImageMessage;

export interface SendMessageRequest {
  email?: string;
  emails?: string[];
  message: MessageContent;
}

export interface SendMessageResponse {
  message_id: string;
}
