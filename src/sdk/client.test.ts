import axios from 'axios';
import { SeaTalkAuth } from './auth';
import { SeaTalkClient } from './client';
import { SEA_TALK_ENDPOINTS } from './endpoints';

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

  it('exposes dynamic API callers for all documented slugs', () => {
    const client = new SeaTalkClient(config);
    const apiSlugs = Object.keys(client.api);

    expect(apiSlugs.length).toBe(Object.keys(SEA_TALK_ENDPOINTS).length);
    expect(typeof client.api['create-group-chat']).toBe('function');
    expect(typeof client.api['messaging_send-message-to-bot-subscriber_']).toBe('function');
  });

  describe('sendMessage', () => {
    it('sends text message to single recipient', async () => {
      mockedAxios.request.mockResolvedValue({
        data: {
          code: 0,
          message: 'success',
          data: {
            message_id: 'msg_123'
          }
        }
      });

      const client = new SeaTalkClient(config);
      const result = await client.sendMessage({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: { content: 'Hello' }
        }
      });

      expect(result.message_id).toBe('msg_123');
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: 'https://openapi.seatalk.io/messaging/v2/single_chat',
          data: {
            employee_code: 'user@example.com',
            message: {
              tag: 'text',
              text: { content: 'Hello' }
            }
          },
          headers: {
            Authorization: 'Bearer mock_access_token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('throws error when neither email nor emails provided', async () => {
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

  describe('invokeApi', () => {
    it('supports endpoint override and GET query mode', async () => {
      mockedAxios.request.mockResolvedValue({
        data: {
          code: 0,
          message: 'ok',
          data: [{ id: 'dept_1' }]
        }
      });

      const client = new SeaTalkClient({
        ...config,
        apiEndpointOverrides: {
          'get-departments': {
            method: 'GET',
            path: '/v1/org/departments'
          }
        }
      });

      const result = await client.invokeApi('get-departments', { active: true }, {
        query: { page: 1 }
      });

      expect(result).toEqual([{ id: 'dept_1' }]);
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: 'https://openapi.seatalk.io/v1/org/departments',
          params: {
            active: true,
            page: 1
          }
        })
      );
    });

    it('does not attach bearer token for non-auth endpoints', async () => {
      mockedAxios.request.mockResolvedValue({
        data: {
          app_access_token: 'token',
          code: 0,
          expire: Math.floor(Date.now() / 1000) + 7200
        }
      });

      const client = new SeaTalkClient(config);
      await client.invokeApi('get-app-access-token', {
        app_id: 'id',
        app_secret: 'secret'
      });

      expect(mockAuth.getAccessToken).not.toHaveBeenCalled();
      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );
    });
  });
});
