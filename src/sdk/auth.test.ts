import { SeaTalkAuth } from './auth';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SeaTalkAuth', () => {
  const config = {
    appId: 'test_app_id',
    appSecret: 'test_app_secret',
    signingSecret: 'test_signing_secret'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should fetch and return access token', async () => {
      const mockResponse = {
        data: {
          app_access_token: 'mock_token_12345',
          code: 0,
          expire: Math.floor(Date.now() / 1000) + 7200
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const auth = new SeaTalkAuth(config);
      const token = await auth.getAccessToken();

      expect(token).toBe('mock_token_12345');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://openapi.seatalk.io/auth/app_access_token',
        {
          app_id: 'test_app_id',
          app_secret: 'test_app_secret'
        }
      );
    });

    it('should cache access token until expiration', async () => {
      const mockResponse = {
        data: {
          app_access_token: 'cached_token',
          code: 0,
          expire: Math.floor(Date.now() / 1000) + 7200
        }
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const auth = new SeaTalkAuth(config);

      const token1 = await auth.getAccessToken();
      const token2 = await auth.getAccessToken();

      expect(token1).toBe(token2);
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('should throw error on API failure', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const auth = new SeaTalkAuth(config);

      await expect(auth.getAccessToken()).rejects.toThrow('Network error');
    });
  });
});
