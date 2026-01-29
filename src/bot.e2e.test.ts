import request from 'supertest';
import { SeaTalkBot } from './index';
import { SeaTalkClient } from './sdk/client';
import {
  mockConfig,
  mockBotEmail,
  createTextMessageEvent
} from './test-helpers/fixtures';
import { createWebhookHeaders } from './test-helpers/signature-utils';

jest.mock('./sdk/client');

const MockedClient = SeaTalkClient as jest.MockedClass<typeof SeaTalkClient>;

describe('SeaTalkBot E2E', () => {
  let bot: SeaTalkBot;
  let mockClient: jest.Mocked<SeaTalkClient>;
  const port = 3001;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockClient = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 'msg_response' })
    } as any;

    MockedClient.mockImplementation(() => mockClient);

    bot = new SeaTalkBot(mockConfig, mockBotEmail);
    await bot.start(port);
  });

  afterEach(async () => {
    await bot.stop();
  });

  describe('Server lifecycle', () => {
    it('should start and stop server cleanly', async () => {
      const testBot = new SeaTalkBot(mockConfig, mockBotEmail);
      await testBot.start(3002);
      await testBot.stop();
      // If we get here without errors, test passes
      expect(true).toBe(true);
    });
  });

  describe('Webhook endpoint', () => {
    it('should accept valid webhook with text message', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: createTextMessageEvent('Hello', 'private')
      };

      const headers = createWebhookHeaders(
        mockConfig.signingSecret,
        event
      );

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .set(headers)
        .send(event);

      expect(response.status).toBe(200);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: {
            content: 'Echo: Hello'
          }
        }
      });
    });

    it('should accept valid webhook with image message', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: {
          message_id: 'msg_img',
          sender: {
            email: 'user@example.com',
            name: 'Test User'
          },
          chat_type: 'private' as const,
          message: {
            tag: 'image',
            image: {
              image_url: 'https://example.com/test.jpg'
            }
          }
        }
      };

      const headers = createWebhookHeaders(
        mockConfig.signingSecret,
        event
      );

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .set(headers)
        .send(event);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 50));

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

  describe('Security', () => {
    it('should reject webhook with invalid signature', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: createTextMessageEvent('Test', 'private')
      };

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .set('x-seatalk-signature', 'invalid_sig')
        .set('x-seatalk-timestamp', String(Math.floor(Date.now() / 1000)))
        .set('x-seatalk-nonce', 'test_nonce')
        .send(event);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('should reject webhook with missing headers', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: createTextMessageEvent('Test', 'private')
      };

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .send(event);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required headers');
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Concurrency', () => {
    it('should handle concurrent webhook requests', async () => {
      const events = [
        {
          event_type: 'message.received',
          timestamp: Date.now(),
          data: createTextMessageEvent('Message 1', 'private')
        },
        {
          event_type: 'message.received',
          timestamp: Date.now(),
          data: createTextMessageEvent('Message 2', 'private')
        },
        {
          event_type: 'message.received',
          timestamp: Date.now(),
          data: createTextMessageEvent('Message 3', 'private')
        }
      ];

      const requests = events.map(event => {
        const headers = createWebhookHeaders(
          mockConfig.signingSecret,
          event
        );

        return request(`http://localhost:${port}`)
          .post('/webhook')
          .set(headers)
          .send(event);
      });

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockClient.sendMessage).toHaveBeenCalledTimes(3);
    });
  });
});
