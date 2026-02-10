import crypto from 'crypto';
import { WebhookVerifier } from './verifier';

describe('WebhookVerifier', () => {
  const signingSecret = 'test_signing_secret_123';
  const verifier = new WebhookVerifier(signingSecret);

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = 'random_nonce_123';
      const body = JSON.stringify({ event_type: 'message.received' });

      // Create valid signature
      const signString = `${timestamp}\n${nonce}\n${body}`;
      const signature = crypto
        .createHmac('sha256', signingSecret)
        .update(signString)
        .digest('hex');

      const result = verifier.verifySignature(
        signature,
        body,
        timestamp,
        nonce
      );

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      const timestamp = String(Math.floor(Date.now() / 1000));
      const nonce = 'random_nonce_123';
      const body = JSON.stringify({ event_type: 'message.received' });
      const invalidSignature = 'invalid_signature_hash_000000000000000000000000000000000000000000000000000000000000';

      const result = verifier.verifySignature(
        invalidSignature,
        body,
        timestamp,
        nonce
      );

      expect(result).toBe(false);
    });

    it('should reject expired timestamp (>5min old)', () => {
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 400); // 6.6 min ago
      const nonce = 'nonce';
      const body = '{}';

      const signString = `${oldTimestamp}\n${nonce}\n${body}`;
      const signature = crypto
        .createHmac('sha256', signingSecret)
        .update(signString)
        .digest('hex');

      const result = verifier.verifySignature(
        signature,
        body,
        oldTimestamp,
        nonce
      );

      expect(result).toBe(false);
    });

    it('should accept recent timestamp (<5min old)', () => {
      const recentTimestamp = String(Math.floor(Date.now() / 1000) - 200); // 3.3 min ago
      const nonce = 'nonce';
      const body = '{}';

      const signString = `${recentTimestamp}\n${nonce}\n${body}`;
      const signature = crypto
        .createHmac('sha256', signingSecret)
        .update(signString)
        .digest('hex');

      const result = verifier.verifySignature(
        signature,
        body,
        recentTimestamp,
        nonce
      );

      expect(result).toBe(true);
    });
  });
});
