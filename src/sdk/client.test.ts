import { SeaTalkClient } from './client';
import { SeaTalkAuth } from './auth';
import axios from 'axios';

jest.mock('axios');
jest.mock('./auth');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MockedAuth = SeaTalkAuth as jest.MockedClass<typeof SeaTalkAuth>;

describe('SeaTalkClient', () => {
  const config = {
    appId: 'test_app',
    appSecret: 'test_secret',
    signingSecret: 'test_sign'
  };

  let mockAuth: jest.Mocked<SeaTalkAuth>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth = {
      getAccessToken: jest.fn().mockResolvedValue('mock_access_token'),
      getSigningSecret: jest.fn().mockReturnValue('test_sign')
    } as any;
    MockedAuth.mockImplementation(() => mockAuth);
  });

  describe('sendMessage', () => {
    it('should send text message to single recipient', async () => {
      const mockResponse = {
        data: {
          code: 0,
          message: 'success',
          data: {
            message_id: 'msg_123'
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const client = new SeaTalkClient(config);
      const result = await client.sendMessage({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: { content: 'Hello' }
        }
      });

      expect(result.message_id).toBe('msg_123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://openapi.seatalk.io/v1/bot/message/send',
        {
          email: 'user@example.com',
          message: {
            tag: 'text',
            text: { content: 'Hello' }
          }
        },
        {
          headers: {
            'Authorization': 'Bearer mock_access_token',
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('should send message to multiple recipients', async () => {
      const mockResponse = {
        data: {
          code: 0,
          message: 'success',
          data: {
            message_id: 'msg_456'
          }
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const client = new SeaTalkClient(config);
      await client.sendMessage({
        emails: ['user1@example.com', 'user2@example.com'],
        message: {
          tag: 'text',
          text: { content: 'Broadcast' }
        }
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          emails: ['user1@example.com', 'user2@example.com']
        }),
        expect.any(Object)
      );
    });

    it('should throw error when neither email nor emails provided', async () => {
      const client = new SeaTalkClient(config);

      await expect(
        client.sendMessage({
          message: {
            tag: 'text',
            text: { content: 'Test' }
          }
        } as any)
      ).rejects.toThrow('Either email or emails must be provided');
    });
  });
});
