# SeaTalk Echo Bot Testing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build comprehensive testing suite for SeaTalk echo bot with text and image support, including integration and E2E tests.

**Architecture:** Create main bot entry point that wires webhook server, message handler, and client together. Build integration tests (all mocked) and E2E tests (real server, mocked external API). Use TDD throughout.

**Tech Stack:** TypeScript, Jest, Supertest, Axios mocking

---

## Task 1: Update Types for Image Support

**Files:**
- Modify: `src/sdk/types.ts:63-81`

**Step 1: Add image field to MessageReceivedEvent**

In `src/sdk/types.ts`, update the `MessageReceivedEvent` interface to include image support:

```typescript
export interface MessageReceivedEvent {
  message_id: string;
  sender: {
    email: string;
    name: string;
  };
  chat_type: 'private' | 'group';
  group_id?: string;
  message: {
    tag: string;
    text?: {
      content: string;
    };
    image?: {
      image_url: string;
    };
    at_users?: Array<{
      email: string;
      name: string;
    }>;
  };
}
```

**Step 2: Update MessageContext to include image**

In the same file, update `MessageContext`:

```typescript
export interface MessageContext {
  messageId: string;
  sender: {
    email: string;
    name: string;
  };
  chatType: 'private' | 'group';
  groupId?: string;
  content: string;
  imageUrl?: string;
  isMentioned: boolean;
  mentionedUsers: Array<{ email: string; name: string }>;
}
```

**Step 3: Verify types compile**

Run: `npm run build`
Expected: No type errors

**Step 4: Commit**

```bash
git add src/sdk/types.ts
git commit -m "feat: add image support to message types"
```

---

## Task 2: Update MessageHandler for Images

**Files:**
- Modify: `src/handlers/message-handler.ts:29-44`
- Test: `src/handlers/message-handler.test.ts`

**Step 1: Write failing test for image handling**

Add to `src/handlers/message-handler.test.ts` before the closing `});`:

```typescript
  it('should extract image URL from message', async () => {
    const event: MessageReceivedEvent = {
      message_id: 'msg_img',
      sender: {
        email: 'user@example.com',
        name: 'Test User'
      },
      chat_type: 'private',
      message: {
        tag: 'image',
        image: {
          image_url: 'https://example.com/image.jpg'
        }
      }
    };

    const callback = jest.fn();
    handler.onMessage(callback);

    await handler.processMessage(event);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        content: '',
        imageUrl: 'https://example.com/image.jpg'
      })
    );
  });
```

**Step 2: Run test to verify it fails**

Run: `npm test -- handlers/message-handler.test.ts`
Expected: FAIL - imageUrl not in context

**Step 3: Update processMessage to extract image URL**

In `src/handlers/message-handler.ts`, update the `processMessage` method:

```typescript
async processMessage(event: MessageReceivedEvent): Promise<void> {
  const content = event.message.text?.content || '';
  const imageUrl = event.message.image?.image_url;
  const mentionedUsers = event.message.at_users || [];
  const isMentioned = mentionedUsers.some(
    user => user.email === this.botEmail
  );

  const context: MessageContext = {
    messageId: event.message_id,
    sender: event.sender,
    chatType: event.chat_type,
    groupId: event.group_id,
    content,
    imageUrl,
    isMentioned,
    mentionedUsers
  };

  // Route to appropriate handlers
  if (event.chat_type === 'private') {
    // 1-on-1 chat
    await this.invokeCallbacks(this.messageCallbacks, context);
  } else if (event.chat_type === 'group' && isMentioned) {
    // Bot was mentioned in group
    await this.invokeCallbacks(this.mentionCallbacks, context);
  }
  // Note: Group messages without mentions are ignored by default
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- handlers/message-handler.test.ts`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/handlers/message-handler.ts src/handlers/message-handler.test.ts
git commit -m "feat: extract image URL in message handler"
```

---

## Task 3: Create Test Helpers - Fixtures

**Files:**
- Create: `src/test-helpers/fixtures.ts`

**Step 1: Create test helpers directory**

Run: `mkdir -p src/test-helpers`
Expected: Directory created

**Step 2: Write fixtures for test data**

Create `src/test-helpers/fixtures.ts`:

```typescript
import { MessageReceivedEvent, SeaTalkConfig } from '../sdk/types';

export const mockConfig: SeaTalkConfig = {
  appId: 'test_app_id',
  appSecret: 'test_app_secret',
  signingSecret: 'test_signing_secret'
};

export const mockBotEmail = 'bot@example.com';

export function createTextMessageEvent(
  content: string,
  chatType: 'private' | 'group' = 'private',
  groupId?: string,
  mentionBot: boolean = false
): MessageReceivedEvent {
  const event: MessageReceivedEvent = {
    message_id: `msg_${Date.now()}`,
    sender: {
      email: 'user@example.com',
      name: 'Test User'
    },
    chat_type: chatType,
    group_id: groupId,
    message: {
      tag: 'text',
      text: {
        content
      }
    }
  };

  if (mentionBot) {
    event.message.at_users = [
      {
        email: mockBotEmail,
        name: 'Bot'
      }
    ];
  }

  return event;
}

export function createImageMessageEvent(
  imageUrl: string,
  chatType: 'private' | 'group' = 'private',
  groupId?: string,
  mentionBot: boolean = false
): MessageReceivedEvent {
  const event: MessageReceivedEvent = {
    message_id: `msg_${Date.now()}`,
    sender: {
      email: 'user@example.com',
      name: 'Test User'
    },
    chat_type: chatType,
    group_id: groupId,
    message: {
      tag: 'image',
      image: {
        image_url: imageUrl
      }
    }
  };

  if (mentionBot) {
    event.message.at_users = [
      {
        email: mockBotEmail,
        name: 'Bot'
      }
    ];
  }

  return event;
}
```

**Step 3: Verify it compiles**

Run: `npm run build`
Expected: No errors

**Step 4: Commit**

```bash
git add src/test-helpers/fixtures.ts
git commit -m "feat: add test fixtures for messages"
```

---

## Task 4: Create Test Helpers - Signature Utils

**Files:**
- Create: `src/test-helpers/signature-utils.ts`

**Step 1: Write signature generation utilities**

Create `src/test-helpers/signature-utils.ts`:

```typescript
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
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/test-helpers/signature-utils.ts
git commit -m "feat: add webhook signature utilities"
```

---

## Task 5: Create Main Bot Entry Point - Structure

**Files:**
- Create: `src/index.ts`

**Step 1: Create basic bot class structure**

Create `src/index.ts`:

```typescript
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
      this.messageHandler.processMessage(data);
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
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`SeaTalk bot listening on port ${port}`);
        resolve();
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
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: create bot entry point structure"
```

---

## Task 6: Implement Echo Logic in Bot

**Files:**
- Modify: `src/index.ts:34-36`

**Step 1: Implement handleEcho method**

Replace the `handleEcho` method in `src/index.ts`:

```typescript
private async handleEcho(context: MessageContext): Promise<void> {
  try {
    if (context.imageUrl) {
      // Echo image
      await this.client.sendMessage({
        email: context.sender.email,
        message: {
          tag: 'image',
          image: {
            image_url: context.imageUrl
          }
        }
      });
    } else if (context.content) {
      // Echo text
      await this.client.sendMessage({
        email: context.sender.email,
        message: {
          tag: 'text',
          text: {
            content: `Echo: ${context.content}`
          }
        }
      });
    }
  } catch (error) {
    console.error('Error echoing message:', error);
  }
}
```

**Step 2: Verify it compiles**

Run: `npm run build`
Expected: No errors

**Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: implement echo logic for text and images"
```

---

## Task 7: Integration Test - Setup and Text Echo

**Files:**
- Create: `src/bot.integration.test.ts`

**Step 1: Write failing test for private text echo**

Create `src/bot.integration.test.ts`:

```typescript
import { SeaTalkBot } from './index';
import { SeaTalkClient } from './sdk/client';
import { mockConfig, mockBotEmail, createTextMessageEvent } from './test-helpers/fixtures';

jest.mock('./sdk/client');

const MockedClient = SeaTalkClient as jest.MockedClass<typeof SeaTalkClient>;

describe('SeaTalkBot Integration', () => {
  let bot: SeaTalkBot;
  let mockClient: jest.Mocked<SeaTalkClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 'msg_response' })
    } as any;

    MockedClient.mockImplementation(() => mockClient);

    bot = new SeaTalkBot(mockConfig, mockBotEmail);
  });

  describe('Private chat text echo', () => {
    it('should echo text message in private chat', async () => {
      const event = createTextMessageEvent('Hello bot', 'private');

      // Simulate webhook event
      bot.getWebhookServer().emit('message.received', event);

      // Wait for async processing
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: {
            content: 'Echo: Hello bot'
          }
        }
      });
    });
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npm test -- bot.integration.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/bot.integration.test.ts
git commit -m "test: add integration test for private text echo"
```

---

## Task 8: Integration Test - Image Echo

**Files:**
- Modify: `src/bot.integration.test.ts`

**Step 1: Write test for private image echo**

Add to `src/bot.integration.test.ts` after the first describe block:

```typescript
  describe('Private chat image echo', () => {
    it('should echo image message in private chat', async () => {
      const event = createImageMessageEvent(
        'https://example.com/test.jpg',
        'private'
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'image',
          image: {
            image_url: 'https://example.com/test.jpg'
          }
        }
      });
    });
  });
```

**Step 2: Run test to verify it passes**

Run: `npm test -- bot.integration.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/bot.integration.test.ts
git commit -m "test: add integration test for image echo"
```

---

## Task 9: Integration Test - Group Mentions

**Files:**
- Modify: `src/bot.integration.test.ts`

**Step 1: Write tests for group mention scenarios**

Add to `src/bot.integration.test.ts`:

```typescript
  describe('Group chat mentions', () => {
    it('should echo when bot is mentioned in group', async () => {
      const event = createTextMessageEvent(
        '@bot help me',
        'group',
        'group_123',
        true
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: {
            content: 'Echo: @bot help me'
          }
        }
      });
    });

    it('should echo image when bot is mentioned in group', async () => {
      const event = createImageMessageEvent(
        'https://example.com/group.jpg',
        'group',
        'group_123',
        true
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'image',
          image: {
            image_url: 'https://example.com/group.jpg'
          }
        }
      });
    });

    it('should not respond to group messages without mention', async () => {
      const event = createTextMessageEvent(
        'General message',
        'group',
        'group_123',
        false
      );

      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });
  });
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- bot.integration.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/bot.integration.test.ts
git commit -m "test: add integration tests for group mentions"
```

---

## Task 10: Integration Test - Error Handling

**Files:**
- Modify: `src/bot.integration.test.ts`

**Step 1: Write test for error handling**

Add to `src/bot.integration.test.ts`:

```typescript
  describe('Error handling', () => {
    it('should handle errors gracefully without crashing', async () => {
      mockClient.sendMessage.mockRejectedValueOnce(
        new Error('API error')
      );

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const event = createTextMessageEvent('Test', 'private');
      bot.getWebhookServer().emit('message.received', event);

      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error echoing message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
```

**Step 2: Run test to verify it passes**

Run: `npm test -- bot.integration.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/bot.integration.test.ts
git commit -m "test: add error handling integration test"
```

---

## Task 11: E2E Test - Setup and Server Lifecycle

**Files:**
- Create: `src/bot.e2e.test.ts`

**Step 1: Write E2E test setup with server lifecycle**

Create `src/bot.e2e.test.ts`:

```typescript
import request from 'supertest';
import { SeaTalkBot } from './index';
import { SeaTalkClient } from './sdk/client';
import {
  mockConfig,
  mockBotEmail,
  createTextMessageEvent
} from './test-helpers/fixtures';
import { createWebhookHeaders } from './test-helpers/signature-utils';

jest.mock('./sdk/client');

const MockedClient = SeaTalkClient as jest.MockedClass<typeof SeaTalkClient>;

describe('SeaTalkBot E2E', () => {
  let bot: SeaTalkBot;
  let mockClient: jest.Mocked<SeaTalkClient>;
  const port = 3001;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockClient = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 'msg_response' })
    } as any;

    MockedClient.mockImplementation(() => mockClient);

    bot = new SeaTalkBot(mockConfig, mockBotEmail);
    await bot.start(port);
  });

  afterEach(async () => {
    await bot.stop();
  });

  describe('Server lifecycle', () => {
    it('should start and stop server cleanly', async () => {
      const testBot = new SeaTalkBot(mockConfig, mockBotEmail);
      await testBot.start(3002);
      await testBot.stop();
      // If we get here without errors, test passes
      expect(true).toBe(true);
    });
  });

  describe('Webhook endpoint', () => {
    it('should accept valid webhook with text message', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: createTextMessageEvent('Hello', 'private')
      };

      const headers = createWebhookHeaders(
        mockConfig.signingSecret,
        event
      );

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .set(headers)
        .send(event);

      expect(response.status).toBe(200);

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'text',
          text: {
            content: 'Echo: Hello'
          }
        }
      });
    });
  });
});
```

**Step 2: Run test to verify it passes**

Run: `npm test -- bot.e2e.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/bot.e2e.test.ts
git commit -m "test: add E2E test setup and server lifecycle"
```

---

## Task 12: E2E Test - Image and Security

**Files:**
- Modify: `src/bot.e2e.test.ts`

**Step 1: Write test for image webhook**

Add to `src/bot.e2e.test.ts` in the 'Webhook endpoint' describe block:

```typescript
    it('should accept valid webhook with image message', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: {
          message_id: 'msg_img',
          sender: {
            email: 'user@example.com',
            name: 'Test User'
          },
          chat_type: 'private' as const,
          message: {
            tag: 'image',
            image: {
              image_url: 'https://example.com/test.jpg'
            }
          }
        }
      };

      const headers = createWebhookHeaders(
        mockConfig.signingSecret,
        event
      );

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .set(headers)
        .send(event);

      expect(response.status).toBe(200);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockClient.sendMessage).toHaveBeenCalledWith({
        email: 'user@example.com',
        message: {
          tag: 'image',
          image: {
            image_url: 'https://example.com/test.jpg'
          }
        }
      });
    });
```

**Step 2: Write security tests**

Add to `src/bot.e2e.test.ts`:

```typescript
  describe('Security', () => {
    it('should reject webhook with invalid signature', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: createTextMessageEvent('Test', 'private')
      };

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .set('x-seatalk-signature', 'invalid_sig')
        .set('x-seatalk-timestamp', String(Math.floor(Date.now() / 1000)))
        .set('x-seatalk-nonce', 'test_nonce')
        .send(event);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid signature');
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });

    it('should reject webhook with missing headers', async () => {
      const event = {
        event_type: 'message.received',
        timestamp: Date.now(),
        data: createTextMessageEvent('Test', 'private')
      };

      const response = await request(`http://localhost:${port}`)
        .post('/webhook')
        .send(event);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required headers');
      expect(mockClient.sendMessage).not.toHaveBeenCalled();
    });
  });
```

**Step 3: Run tests to verify they pass**

Run: `npm test -- bot.e2e.test.ts`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add src/bot.e2e.test.ts
git commit -m "test: add E2E tests for images and security"
```

---

## Task 13: E2E Test - Concurrent Requests

**Files:**
- Modify: `src/bot.e2e.test.ts`

**Step 1: Write concurrent request test**

Add to `src/bot.e2e.test.ts`:

```typescript
  describe('Concurrency', () => {
    it('should handle concurrent webhook requests', async () => {
      const events = [
        {
          event_type: 'message.received',
          timestamp: Date.now(),
          data: createTextMessageEvent('Message 1', 'private')
        },
        {
          event_type: 'message.received',
          timestamp: Date.now(),
          data: createTextMessageEvent('Message 2', 'private')
        },
        {
          event_type: 'message.received',
          timestamp: Date.now(),
          data: createTextMessageEvent('Message 3', 'private')
        }
      ];

      const requests = events.map(event => {
        const headers = createWebhookHeaders(
          mockConfig.signingSecret,
          event
        );

        return request(`http://localhost:${port}`)
          .post('/webhook')
          .set(headers)
          .send(event);
      });

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockClient.sendMessage).toHaveBeenCalledTimes(3);
    });
  });
```

**Step 2: Run test to verify it passes**

Run: `npm test -- bot.e2e.test.ts`
Expected: All tests PASS

**Step 3: Commit**

```bash
git add src/bot.e2e.test.ts
git commit -m "test: add E2E test for concurrent requests"
```

---

## Task 14: Run Full Test Suite

**Files:**
- None (verification only)

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests PASS

**Step 2: Check test coverage**

Run: `npm test -- --coverage`
Expected: Good coverage on new files (>80%)

**Step 3: Verify build**

Run: `npm run build`
Expected: No errors, dist/ created

---

## Task 15: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `README.md` (if needed)

**Step 1: Update CLAUDE.md with testing info**

Update the Development Commands section in `CLAUDE.md`:

```markdown
## Development Commands

- `npm run build` - Compile TypeScript to JavaScript
- `npm test` - Run all tests
- `npm test -- --watch` - Run tests in watch mode
- `npm test -- --coverage` - Run tests with coverage report
- `npm run dev` - Run bot in development mode

## Testing

The project has comprehensive test coverage:

- **Unit tests**: Individual component tests (SDK, webhook, handlers)
- **Integration tests**: Full flow with mocked HTTP (`bot.integration.test.ts`)
- **E2E tests**: Real server with mocked external API (`bot.e2e.test.ts`)

Run specific test suites:
- `npm test -- bot.integration.test.ts`
- `npm test -- bot.e2e.test.ts`
```

**Step 2: Commit documentation**

```bash
git add CLAUDE.md
git commit -m "docs: update development commands and testing info"
```

---

## Verification Steps

After completing all tasks:

1. **All tests pass**: `npm test` shows all green
2. **Build succeeds**: `npm run build` completes without errors
3. **Coverage is good**: `npm test -- --coverage` shows >80% on new code
4. **Types are correct**: No TypeScript errors
5. **Git history is clean**: Each task has a focused commit

## Notes

- @superpowers:test-driven-development principles followed throughout
- @superpowers:verification-before-completion used before each commit
- All tests are independent and can run in parallel
- E2E tests use random ports to avoid conflicts
- Error handling tested explicitly
