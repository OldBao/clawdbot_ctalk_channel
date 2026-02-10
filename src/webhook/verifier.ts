import crypto from 'crypto';

export class WebhookVerifier {
  private signingSecret: string;
  private maxTimestampDelta: number;

  constructor(signingSecret: string, maxTimestampDeltaSec: number = 300) {
    this.signingSecret = signingSecret;
    this.maxTimestampDelta = maxTimestampDeltaSec;
  }

  verifySignature(
    signature: string,
    body: string,
    timestamp?: string,
    nonce?: string
  ): boolean {
    // Seatalk Open Platform: sha256(body + signing_secret), hex lowercase.
    if (!timestamp || !nonce) {
      const expectedSignature = crypto
        .createHash('sha256')
        .update(`${body}${this.signingSecret}`)
        .digest('hex');

      if (signature.length !== expectedSignature.length) {
        return false;
      }
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    }

    // Legacy scheme: HMAC with timestamp/nonce
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp, 10);

    if (isNaN(requestTime) || Math.abs(now - requestTime) > this.maxTimestampDelta) {
      return false;
    }

    const signString = `${timestamp}\n${nonce}\n${body}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.signingSecret)
      .update(signString)
      .digest('hex');

    // Check length before comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
