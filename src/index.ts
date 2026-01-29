import express from 'express';
import { Server } from 'http';
import { SeaTalkClient } from './sdk/client';
import { WebhookServer } from './webhook/server';
import { MessageHandler } from './handlers/message-handler';
import { SeaTalkConfig, MessageContext } from './sdk/types';

export class SeaTalkBot {
  private config: SeaTalkConfig;
  private botEmail: string;
  private client: SeaTalkClient;
  private webhookServer: WebhookServer;
  private messageHandler: MessageHandler;
  private app: express.Application;
  private server?: Server;

  constructor(config: SeaTalkConfig, botEmail: string) {
    this.config = config;
    this.botEmail = botEmail;
    this.client = new SeaTalkClient(config);
    this.webhookServer = new WebhookServer(config);
    this.messageHandler = new MessageHandler(botEmail);
    this.app = express();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Wire webhook events to message handler
    this.webhookServer.on('message.received', (data) => {
      this.messageHandler.processMessage(data).catch(err => {
        console.error('Error processing message:', err);
      });
    });

    // Register echo handlers
    this.messageHandler.onMessage(this.handleEcho.bind(this));
    this.messageHandler.onMention(this.handleEcho.bind(this));

    // Mount webhook server
    this.webhookServer.mount(this.app);
  }

  private async handleEcho(context: MessageContext): Promise<void> {
    // TODO: Implement echo logic
  }

  async start(port: number = 3000): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(port, () => {
        console.log(`SeaTalk bot listening on port ${port}`);
        resolve();
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  getWebhookServer(): WebhookServer {
    return this.webhookServer;
  }

  getClient(): SeaTalkClient {
    return this.client;
  }
}
