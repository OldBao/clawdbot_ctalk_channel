import { SeaTalkBot } from './index';
import { SeaTalkClient } from './sdk/client';
import { mockConfig, mockBotEmail, createTextMessageEvent, createImageMessageEvent } from './test-helpers/fixtures';

jest.mock('./sdk/client');

const MockedClient = SeaTalkClient as jest.MockedClass<typeof SeaTalkClient>;

describe('SeaTalkBot Integration', () => {
  let bot: SeaTalkBot;
  let mockClient: jest.Mocked<SeaTalkClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 'msg_response' })
    } as any;

    MockedClient.mockImplementation(() => mockClient);

    bot = new SeaTalkBot(mockConfig, mockBotEmail);
  });

  describe('Private chat text echo', () => {
    it('should echo text message in private chat', async () => {
      const event = createTextMessageEvent('Hello bot', 'private');

      // Simulate webhook event
      bot.getWebhookServer().emit('message.received', event);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: {
            content: 'Echo: Hello bot'
          }
        }
      });
    });
  });

  describe('Private chat image echo', () => {
    it('should echo image message in private chat', async () => {
      const event = createImageMessageEvent(
        'https://example.com/test.jpg',
        'private'
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'image',
          image: {
            image_url: 'https://example.com/test.jpg'
          }
        }
      });
    });
  });

  describe('Group chat mentions', () => {
    it('should echo when bot is mentioned in group', async () => {
      const event = createTextMessageEvent(
        '@bot help me',
        'group',
        'group_123',
        true
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: {
            content: 'Echo: @bot help me'
          }
        }
      });
    });

    it('should echo image when bot is mentioned in group', async () => {
      const event = createImageMessageEvent(
        'https://example.com/group.jpg',
        'group',
        'group_123',
        true
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'image',
          image: {
            image_url: 'https://example.com/group.jpg'
          }
        }
      });
    });

    it('should not respond to group messages without mention', async () => {
      const event = createTextMessageEvent(
        'General message',
        'group',
        'group_123',
        false
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle errors gracefully without crashing', async () => {
      mockClient.sendMessage.mockRejectedValueOnce(
        new Error('API error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const event = createTextMessageEvent('Test', 'private');
      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error echoing message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});
