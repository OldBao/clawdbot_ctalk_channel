import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import { WebhookServer } from './server';
import { SeaTalkConfig } from '../sdk/types';

describe('WebhookServer', () => {
  const config: SeaTalkConfig = {
    appId: 'test_app',
    appSecret: 'test_secret',
    signingSecret: 'test_signing_secret'
  };

  let app: express.Application;
  let server: WebhookServer;

  beforeEach(() => {
    app = express();
    server = new WebhookServer(config, '/webhook');
    server.mount(app);
  });

  const createSignature = (timestamp: string, nonce: string, body: string) => {
    const signString = `${timestamp}\n${nonce}\n${body}`;
    return crypto
      .createHmac('sha256', config.signingSecret)
      .update(signString)
      .digest('hex');
  };

  describe('POST /webhook', () => {
    it('should accept valid webhook request', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = 'test_nonce';
      const body = { event_type: 'message.received', data: {} };
      const bodyStr = JSON.stringify(body);
      const signature = createSignature(timestamp, nonce, bodyStr);

      const response = await request(app)
        .post('/webhook')
        .set('x-seatalk-signature', signature)
        .set('x-seatalk-timestamp', timestamp)
        .set('x-seatalk-nonce', nonce)
        .send(body);

      expect(response.status).toBe(200);
    });

    it('should reject request with invalid signature', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = 'test_nonce';
      const body = { event_type: 'message.received' };

      const response = await request(app)
        .post('/webhook')
        .set('x-seatalk-signature', 'invalid_signature')
        .set('x-seatalk-timestamp', timestamp)
        .set('x-seatalk-nonce', nonce)
        .send(body);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
    });

    it('should reject request missing headers', async () => {
      const response = await request(app)
        .post('/webhook')
        .send({ event_type: 'test' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required header: signature');
    });

    it('should emit event for valid webhook', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = 'test_nonce';
      const body = {
        event_type: 'message.received',
        data: { message_id: 'msg_123' }
      };
      const bodyStr = JSON.stringify(body);
      const signature = createSignature(timestamp, nonce, bodyStr);

      const eventHandler = jest.fn();
      server.on('message.received', eventHandler);

      await request(app)
        .post('/webhook')
        .set('x-seatalk-signature', signature)
        .set('x-seatalk-timestamp', timestamp)
        .set('x-seatalk-nonce', nonce)
        .send(body);

      expect(eventHandler).toHaveBeenCalledWith({
        message_id: 'msg_123'
      });
    });

    it('should normalize message_from_bot_subscriber using employee_code as sender email', async () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = 'test_nonce';
      const body = {
        event_type: 'message_from_bot_subscriber',
        event: {
          employee_code: '74723',
          email: 'andy.zhanggx@shopee.com',
          message: {
            message_id: 'msg_abc',
            tag: 'text',
            text: { content: 'hi' }
          }
        }
      };
      const bodyStr = JSON.stringify(body);
      const signature = createSignature(timestamp, nonce, bodyStr);

      const eventHandler = jest.fn();
      server.on('message.received', eventHandler);

      const response = await request(app)
        .post('/webhook')
        .set('x-seatalk-signature', signature)
        .set('x-seatalk-timestamp', timestamp)
        .set('x-seatalk-nonce', nonce)
        .send(body);

      expect(response.status).toBe(200);
      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message_id: 'msg_abc',
          sender: expect.objectContaining({
            email: '74723'
          }),
          message: expect.objectContaining({
            tag: 'text',
            text: { content: 'hi' }
          })
        })
      );
    });
  });
});
