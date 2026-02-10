import axios from 'axios';
import { SeaTalkAuth } from './auth';
import {
  SeaTalkConfig,
  SendMessageRequest,
  SendMessageResponse,
  ApiResponse
} from './types';
import {
  SEA_TALK_ENDPOINTS,
  SeaTalkApiSlug,
  SeaTalkEndpointDefinition,
  SeaTalkHttpMethod
} from './endpoints';

type JsonObject = Record<string, unknown>;

interface InvokeApiOptions {
  query?: JsonObject;
  headers?: Record<string, string>;
}

export class SeaTalkClient {
  private auth: SeaTalkAuth;
  private baseUrl: string;
  private endpointOverrides: SeaTalkConfig['apiEndpointOverrides'];
  public readonly api: Record<
    SeaTalkApiSlug,
    (payload?: JsonObject, options?: InvokeApiOptions) => Promise<unknown>
  >;

  constructor(config: SeaTalkConfig) {
    this.auth = new SeaTalkAuth(config);
    this.baseUrl = config.baseUrl || 'https://openapi.seatalk.io';
    this.endpointOverrides = config.apiEndpointOverrides;
    this.api = this.buildApiSurface();
  }

  async invokeApi(
    slug: SeaTalkApiSlug,
    payload: JsonObject = {},
    options: InvokeApiOptions = {}
  ): Promise<unknown> {
    const endpoint = this.resolveEndpoint(slug);
    const token = endpoint.auth === false
      ? null
      : await this.auth.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await axios.request<ApiResponse<unknown>>({
      method: endpoint.method,
      url: `${this.baseUrl}${endpoint.path}`,
      ...(this.shouldUseBody(endpoint.method)
        ? { data: payload }
        : { params: { ...(payload || {}), ...(options.query || {}) } }),
      ...(this.shouldUseBody(endpoint.method) && options.query
        ? { params: options.query }
        : {}),
      headers
    });

    if (typeof response.data !== 'object' || response.data === null) {
      throw new Error(`Invalid API response for ${slug}`);
    }

    if ('data' in response.data) {
      return response.data.data;
    }

    return response.data;
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!request.email && !request.emails) {
      throw new Error('Either email or emails must be provided');
    }

    const result = await this.invokeApi(
      'messaging_send-message-to-bot-subscriber_',
      {
        ...(request.email ? { employee_code: request.email } : {}),
        ...(request.emails ? { employee_codes: request.emails } : {}),
        message: request.message
      }
    );

    if (result && typeof result === 'object' && 'code' in result) {
      const apiCode = (result as any).code;
      if (typeof apiCode === 'number' && apiCode !== 0) {
        const apiMessage = (result as any).message || 'unknown error';
        throw new Error(`Failed to send message: ${apiMessage} (code ${apiCode})`);
      }
    }

    if (result && typeof result === 'object' && 'message_id' in result) {
      return result as SendMessageResponse;
    }

    if (result && typeof result === 'object' && 'messageId' in result) {
      return { message_id: String((result as any).messageId) };
    }

    // Some endpoints acknowledge success without message ID.
    return { message_id: '' };
  }

  private buildApiSurface(): Record<
    SeaTalkApiSlug,
    (payload?: JsonObject, options?: InvokeApiOptions) => Promise<unknown>
  > {
    const entries = Object.keys(SEA_TALK_ENDPOINTS).map((slug) => {
      const typedSlug = slug as SeaTalkApiSlug;
      return [
        typedSlug,
        (payload: JsonObject = {}, options: InvokeApiOptions = {}) =>
          this.invokeApi(typedSlug, payload, options)
      ] as const;
    });

    return Object.fromEntries(entries) as Record<
      SeaTalkApiSlug,
      (payload?: JsonObject, options?: InvokeApiOptions) => Promise<unknown>
    >;
  }

  private resolveEndpoint(slug: SeaTalkApiSlug): SeaTalkEndpointDefinition {
    const base = SEA_TALK_ENDPOINTS[slug] as SeaTalkEndpointDefinition;
    const override = this.endpointOverrides?.[slug];

    const method = (override?.method || base.method) as SeaTalkHttpMethod;
    const path = override?.path || base.path;
    const auth = override?.auth ?? base.auth;

    return { method, path, auth };
  }

  private shouldUseBody(method: SeaTalkHttpMethod): boolean {
    return method === 'POST' || method === 'PUT' || method === 'PATCH';
  }
}
