import { MessageHandler } from './message-handler';
import { MessageReceivedEvent, MessageContext } from '../sdk/types';

describe('MessageHandler', () => {
  let handler: MessageHandler;
  const botEmail = 'bot@example.com';

  beforeEach(() => {
    handler = new MessageHandler(botEmail);
  });

  describe('processMessage', () => {
    it('should process 1-on-1 message', async () => {
      const event: MessageReceivedEvent = {
        message_id: 'msg_123',
        sender: {
          email: 'user@example.com',
          name: 'Test User'
        },
        chat_type: 'private',
        message: {
          tag: 'text',
          text: {
            content: 'Hello bot'
          }
        }
      };

      const callback = jest.fn();
      handler.onMessage(callback);

      await handler.processMessage(event);

      expect(callback).toHaveBeenCalledWith({
        messageId: 'msg_123',
        sender: {
          email: 'user@example.com',
          name: 'Test User'
        },
        chatType: 'private',
        groupId: undefined,
        content: 'Hello bot',
        isMentioned: false,
        mentionedUsers: []
      });
    });

    it('should process group message without mention', async () => {
      const event: MessageReceivedEvent = {
        message_id: 'msg_456',
        sender: {
          email: 'user@example.com',
          name: 'Test User'
        },
        chat_type: 'group',
        group_id: 'group_789',
        message: {
          tag: 'text',
          text: {
            content: 'General message'
          }
        }
      };

      const callback = jest.fn();
      handler.onGroupMessage(callback);

      await handler.processMessage(event);

      // Should not trigger callback since bot not mentioned
      expect(callback).not.toHaveBeenCalled();
    });

    it('should process group message with bot mention', async () => {
      const event: MessageReceivedEvent = {
        message_id: 'msg_789',
        sender: {
          email: 'user@example.com',
          name: 'Test User'
        },
        chat_type: 'group',
        group_id: 'group_123',
        message: {
          tag: 'text',
          text: {
            content: '@bot help me'
          },
          at_users: [
            {
              email: botEmail,
              name: 'Bot'
            }
          ]
        }
      };

      const callback = jest.fn();
      handler.onMention(callback);

      await handler.processMessage(event);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg_789',
          chatType: 'group',
          groupId: 'group_123',
          content: '@bot help me',
          isMentioned: true
        })
      );
    });

    it('should handle message without text content', async () => {
      const event: MessageReceivedEvent = {
        message_id: 'msg_img',
        sender: {
          email: 'user@example.com',
          name: 'Test User'
        },
        chat_type: 'private',
        message: {
          tag: 'image'
        }
      };

      const callback = jest.fn();
      handler.onMessage(callback);

      await handler.processMessage(event);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          content: ''
        })
      );
    });
  });
});
