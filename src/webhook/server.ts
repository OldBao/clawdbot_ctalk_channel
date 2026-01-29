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
    app.post(
      this.path,
      express.json(),
      this.handleWebhook.bind(this)
    );
  }

  private handleWebhook(req: Request, res: Response): void {
    const signature = req.headers['x-seatalk-signature'] as string;
    const timestamp = req.headers['x-seatalk-timestamp'] as string;
    const nonce = req.headers['x-seatalk-nonce'] as string;

    // Validate required headers
    if (!signature || !timestamp || !nonce) {
      res.status(400).json({
        error: 'Missing required headers: x-seatalk-signature, x-seatalk-timestamp, x-seatalk-nonce'
      });
      return;
    }

    // Verify signature
    const body = JSON.stringify(req.body);
    const isValid = this.verifier.verifySignature(
      signature,
      timestamp,
      nonce,
      body
    );

    if (!isValid) {
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Process webhook event
    const event = req.body as WebhookEvent;
    this.emit(event.event_type, event.data);

    res.status(200).json({ success: true });
  }
}
