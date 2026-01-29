import crypto from 'crypto';

export function generateSignature(
  signingSecret: string,
  timestamp: string,
  nonce: string,
  body: string
): string {
  const signString = `${timestamp}\n${nonce}\n${body}`;
  return crypto
    .createHmac('sha256', signingSecret)
    .update(signString)
    .digest('hex');
}

export function createWebhookHeaders(
  signingSecret: string,
  body: any
): {
  'x-seatalk-signature': string;
  'x-seatalk-timestamp': string;
  'x-seatalk-nonce': string;
} {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const nonce = `nonce_${Date.now()}`;
  const bodyStr = JSON.stringify(body);
  const signature = generateSignature(signingSecret, timestamp, nonce, bodyStr);

  return {
    'x-seatalk-signature': signature,
    'x-seatalk-timestamp': timestamp,
    'x-seatalk-nonce': nonce
  };
}
