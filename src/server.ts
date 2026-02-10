import 'dotenv/config';
import { SeaTalkBot } from './index';
import { SeaTalkConfig } from './sdk/types';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

async function main(): Promise<void> {
  const config: SeaTalkConfig = {
    appId: requireEnv('SEATALK_APP_ID'),
    appSecret: requireEnv('SEATALK_APP_SECRET'),
    signingSecret: requireEnv('SEATALK_SIGNING_SECRET')
  };

  const botEmail = process.env.SEATALK_BOT_EMAIL || 'bot@example.com';
  const port = Number(process.env.PORT || 8090);
  const webhookPath = process.env.CALLBACK_PATH || '/webhook';

  const bot = new SeaTalkBot(config, botEmail, webhookPath);

  console.log('Starting SeaTalk bot server...');
  console.log(`Port: ${port}`);
  console.log(`Webhook path: ${webhookPath}`);
  console.log(`Bot email: ${botEmail}`);

  await bot.start(port);
}

main().catch((err) => {
  console.error('Failed to start SeaTalk bot server:', err);
  process.exit(1);
});
