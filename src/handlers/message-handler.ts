import {
  MessageReceivedEvent,
  MessageContext,
  MessageHandlerCallback
} from '../sdk/types';

export class MessageHandler {
  private botEmail: string;
  private messageCallbacks: MessageHandlerCallback[] = [];
  private groupCallbacks: MessageHandlerCallback[] = [];
  private mentionCallbacks: MessageHandlerCallback[] = [];

  constructor(botEmail: string) {
    this.botEmail = botEmail;
  }

  onMessage(callback: MessageHandlerCallback): void {
    this.messageCallbacks.push(callback);
  }

  onGroupMessage(callback: MessageHandlerCallback): void {
    this.groupCallbacks.push(callback);
  }

  onMention(callback: MessageHandlerCallback): void {
    this.mentionCallbacks.push(callback);
  }

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

  private async invokeCallbacks(
    callbacks: MessageHandlerCallback[],
    context: MessageContext
  ): Promise<void> {
    for (const callback of callbacks) {
      try {
        await callback(context);
      } catch (error) {
        console.error('Error in message handler callback:', error);
      }
    }
  }
}
