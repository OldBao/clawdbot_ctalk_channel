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

export interface WebhookHeaders {
  'x-seatalk-signature'?: string;
  'x-seatalk-timestamp'?: string;
  'x-seatalk-nonce'?: string;
}

export interface WebhookEvent {
  event_type: string;
  timestamp: number;
  data: unknown;
}

export interface MessageReceivedEvent {
  message_id: string;
  sender: {
    email: string;
    name: string;
  };
  chat_type: 'private' | 'group';
  group_id?: string;
  message: {
    tag: string;
    text?: {
      content: string;
    };
    at_users?: Array<{
      email: string;
      name: string;
    }>;
  };
}
