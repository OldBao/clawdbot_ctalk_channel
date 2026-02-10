import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';
import { WebhookVerifier } from './verifier';
import { SeaTalkConfig, WebhookEvent } from '../sdk/types';

export class WebhookServer extends EventEmitter {
  private verifier: WebhookVerifier;
  private path: string;

  constructor(config: SeaTalkConfig, path: string = '/webhook') {
    super();
    this.verifier = new WebhookVerifier(config.signingSecret);
    this.path = path;
  }

  mount(app: express.Application): void {
    // Debug endpoint to inspect incoming Seatalk headers/body.
    // Enable with SEATALK_DEBUG_HEADERS=1.
    app.all("/seatalk-debug", express.json(), (req: Request, res: Response) => {
      if (process.env.SEATALK_DEBUG_HEADERS !== "1") {
        res.status(404).end();
        return;
      }
      const snapshot = {
        method: req.method,
        path: req.originalUrl,
        headers: req.headers,
        body: req.body ?? null,
      };
      console.log(`SEATALK DEBUG ${JSON.stringify(snapshot)}`);

      // Seatalk verification handshake expects the challenge echo.
      if (req.body && req.body.event_type === "event_verification") {
        const challenge = req.body.event?.seatalk_challenge;
        if (!challenge) {
          res.status(400).json({ error: "Missing seatalk_challenge" });
          return;
        }
        res.status(200).json({ seatalk_challenge: challenge });
        return;
      }

      res.status(200).json(snapshot);
    });

    app.post(
      this.path,
      express.json(),
      this.handleWebhook.bind(this)
    );
  }

  private handleWebhook(req: Request, res: Response): void {
    if (process.env.SEATALK_DEBUG_BODY === '1') {
      const body = JSON.stringify(req.body);
      const maxLen = 4096;
      const clipped = body.length > maxLen ? `${body.slice(0, maxLen)}...[truncated]` : body;
      console.log(`WEBHOOK BODY ${clipped}`);
      console.log(`WEBHOOK HEADERS x-seatalk-signature=${req.headers['x-seatalk-signature'] || ''} x-seatalk-timestamp=${req.headers['x-seatalk-timestamp'] || ''} x-seatalk-nonce=${req.headers['x-seatalk-nonce'] || ''}`);
    }

    // Handle verification handshake without signature headers
    if (req.body && req.body.event_type === 'event_verification') {
      const challenge = req.body.event?.seatalk_challenge;
      if (!challenge) {
        res.status(400).json({ error: 'Missing seatalk_challenge' });
        return;
      }
      res.status(200).json({ seatalk_challenge: challenge });
      return;
    }

    const signature =
      (req.headers['signature'] as string) ||
      (req.headers['x-seatalk-signature'] as string);
    const timestamp = req.headers['x-seatalk-timestamp'] as string | undefined;
    const nonce = req.headers['x-seatalk-nonce'] as string | undefined;

    if (!signature) {
      res.status(400).json({
        error: 'Missing required header: signature'
      });
      return;
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const isValid = this.verifier.verifySignature(
      signature,
      body,
      timestamp,
      nonce
    );

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Process webhook event
    const event = req.body as WebhookEvent & { event?: unknown };
    const payload = (event as any).data ?? (event as any).event ?? null;

    // Normalize Seatalk message event into internal message.received
    if (event.event_type === 'message_from_bot_subscriber' && payload && typeof payload === 'object') {
      const msg = (payload as any).message || {};
      const email = (payload as any).email || '';
      const employeeCode = (payload as any).employee_code || '';
      const senderCode = employeeCode || email;
      const normalized = {
        message_id: msg.message_id || '',
        sender: {
          // Use employee_code as sender key for reply APIs that expect code.
          email: senderCode,
          name: email || senderCode || 'Unknown'
        },
        chat_type: 'private',
        message: {
          tag: msg.tag,
          text: msg.text,
          image: msg.image,
          at_users: msg.at_users
        }
      };
      this.emit('message.received', normalized);
      res.status(200).json({ success: true });
      return;
    }

    this.emit(event.event_type, payload);

    res.status(200).json({ success: true });
  }
}
