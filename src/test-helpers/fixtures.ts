import { MessageReceivedEvent, SeaTalkConfig } from '../sdk/types';

export const mockConfig: SeaTalkConfig = {
  appId: 'test_app_id',
  appSecret: 'test_app_secret',
  signingSecret: 'test_signing_secret'
};

export const mockBotEmail = 'bot@example.com';

export function createTextMessageEvent(
  content: string,
  chatType: 'private' | 'group' = 'private',
  groupId?: string,
  mentionBot: boolean = false
): MessageReceivedEvent {
  const event: MessageReceivedEvent = {
    message_id: `msg_${Date.now()}`,
    sender: {
      email: 'user@example.com',
      name: 'Test User'
    },
    chat_type: chatType,
    group_id: groupId,
    message: {
      tag: 'text',
      text: {
        content
      }
    }
  };

  if (mentionBot) {
    event.message.at_users = [
      {
        email: mockBotEmail,
        name: 'Bot'
      }
    ];
  }

  return event;
}

export function createImageMessageEvent(
  imageUrl: string,
  chatType: 'private' | 'group' = 'private',
  groupId?: string,
  mentionBot: boolean = false
): MessageReceivedEvent {
  const event: MessageReceivedEvent = {
    message_id: `msg_${Date.now()}`,
    sender: {
      email: 'user@example.com',
      name: 'Test User'
    },
    chat_type: chatType,
    group_id: groupId,
    message: {
      tag: 'image',
      image: {
        image_url: imageUrl
      }
    }
  };

  if (mentionBot) {
    event.message.at_users = [
      {
        email: mockBotEmail,
        name: 'Bot'
      }
    ];
  }

  return event;
}
