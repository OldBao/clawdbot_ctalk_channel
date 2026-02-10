export type SeaTalkHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SeaTalkEndpointDefinition {
  method: SeaTalkHttpMethod;
  path: string;
  auth?: boolean;
}

export const SEA_TALK_ENDPOINTS = {
  'api-development-guide': { method: 'POST', path: '/v1/api-development-guide' },
  'overview-server-apis': { method: 'POST', path: '/v1/overview-server-apis' },
  'OpenAPI-Pagination-standard': { method: 'POST', path: '/v1/openapi-pagination-standard' },
  'SeaTalk-Model-Context-Protocol-Server': { method: 'POST', path: '/v1/seatalk-model-context-protocol-server' },
  'server-apis-event-callback': { method: 'POST', path: '/v1/server-apis-event-callback' },
  'list-of-events': { method: 'GET', path: '/v1/list-of-events' },
  'get-app-access-token': { method: 'POST', path: '/auth/app_access_token', auth: false },
  'verify-sso-token': { method: 'POST', path: '/v1/verify-sso-token' },
  'code-to-employee': { method: 'POST', path: '/v1/code-to-employee' },
  'Get-Bot-Subscriber-List': { method: 'GET', path: '/v1/get-bot-subscriber-list' },
  'get-employee-profile': { method: 'GET', path: '/v1/get-employee-profile' },
  'get-employee-code-with-email': { method: 'GET', path: '/v1/get-employee-code-with-email' },
  'get-user-lang-pref': { method: 'GET', path: '/v1/get-user-lang-pref' },
  'onboard-employee': { method: 'POST', path: '/v1/onboard-employee' },
  'reboard-employee': { method: 'POST', path: '/v1/reboard-employee' },
  'Delete-Employee': { method: 'DELETE', path: '/v1/delete-employee' },
  'update-employee': { method: 'PUT', path: '/v1/update-employee' },
  'update-employee-avatar': { method: 'PUT', path: '/v1/update-employee-avatar' },
  'check-employee-existenece': { method: 'GET', path: '/v1/check-employee-existenece' },
  'create-department': { method: 'POST', path: '/v1/create-department' },
  'get-departments': { method: 'GET', path: '/v1/get-departments' },
  'get-department-employees': { method: 'GET', path: '/v1/get-department-employees' },
  'update-department': { method: 'PUT', path: '/v1/update-department' },
  'delete-department': { method: 'DELETE', path: '/v1/delete-department' },
  'Get-Thread-by-Thread-ID-in-Private-Chat': { method: 'GET', path: '/v1/get-thread-by-thread-id-in-private-chat' },
  'new_message_received_from_thread': { method: 'POST', path: '/v1/new_message_received_from_thread' },
  'user_enter_chatroom_with_bot': { method: 'POST', path: '/v1/user_enter_chatroom_with_bot' },
  'Set-Typing-Status-in-Group-Chat': { method: 'POST', path: '/v1/set-typing-status-in-group-chat' },
  'Set-Typing-Status-in-Private-Chat': { method: 'POST', path: '/v1/set-typing-status-in-private-chat' },
  'Get-Message-by-Message-ID': { method: 'GET', path: '/v1/get-message-by-message-id' },
  'event_new_bot_subscriber': { method: 'POST', path: '/v1/event_new_bot_subscriber' },
  'messaging_send-message-to-bot-user_': { method: 'POST', path: '/v1/messaging_send-message-to-bot-user' },
  'event_message_received_from_bot_subscriber': { method: 'POST', path: '/v1/event_message_received_from_bot_subscriber' },
  'Send-Message-to-Group-Chat': { method: 'POST', path: '/v1/send-message-to-group-chat' },
  'event_new_mentioned_message_from_group_chat': { method: 'POST', path: '/v1/event_new_mentioned_message_from_group_chat' },
  'Update-Interactive-Message-Card': { method: 'POST', path: '/v1/update-interactive-message-card' },
  'event_interactive_message_click': { method: 'POST', path: '/v1/event_interactive_message_click' },
  'overview-of-approval-center': { method: 'POST', path: '/v1/overview-of-approval-center' },
  'approval-center-definition-explanations': { method: 'POST', path: '/v1/approval-center-definition-explanations' },
  'create-approval-item': { method: 'POST', path: '/v1/create-approval-item' },
  'get-approval-item': { method: 'GET', path: '/v1/get-approval-item' },
  'update-approval-item': { method: 'PUT', path: '/v1/update-approval-item' },
  'delete-approval-item': { method: 'DELETE', path: '/v1/delete-approval-item' },
  'approval-center-callback-signature-verification': { method: 'POST', path: '/v1/approval-center-callback-signature-verification' },
  'Add-Group-Members': { method: 'POST', path: '/v1/add-group-members' },
  'Remove-Group-Members': { method: 'DELETE', path: '/v1/remove-group-members' },
  'create-group-chat': { method: 'POST', path: '/v1/create-group-chat' },
  'Get-Thread-by-Thread-ID': { method: 'GET', path: '/v1/get-thread-by-thread-id' },
  'event-bot-added-to-group-chat': { method: 'POST', path: '/v1/event-bot-added-to-group-chat' },
  'Get-Joined-Group-Chat-List': { method: 'GET', path: '/v1/get-joined-group-chat-list' },
  'get-group-info': { method: 'GET', path: '/v1/get-group-info' },
  'Event-Bot-Removed-From-Group-Chat': { method: 'POST', path: '/v1/event-bot-removed-from-group-chat' },
  'get-chat-history': { method: 'GET', path: '/v1/get-chat-history' },
  'messaging_send-service-notice_i18n': { method: 'POST', path: '/v1/messaging_send-service-notice_i18n' },
  'messaging_send-service-notice': { method: 'POST', path: '/v1/messaging_send-service-notice' },
  'messaging_send-notification-badge': { method: 'POST', path: '/v1/messaging_send-notification-badge' },
  'admin-audit-logs': { method: 'POST', path: '/v1/admin-audit-logs' },
  'build-an-app-for-your-team': { method: 'POST', path: '/v1/build-an-app-for-your-team' },
  'messaging_send-message-to-bot-subscriber_': {
    method: 'POST',
    path: '/messaging/v2/single_chat'
  }
} as const satisfies Record<string, SeaTalkEndpointDefinition>;

export type SeaTalkApiSlug = keyof typeof SEA_TALK_ENDPOINTS;
