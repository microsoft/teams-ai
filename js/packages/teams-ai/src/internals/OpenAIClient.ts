/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// eslint-disable-next-line import/named
import axios, { AxiosInstance } from 'axios';
import {
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    CreateEmbeddingRequest,
    CreateEmbeddingResponse,
    CreateModerationRequest,
    ModerationResponse
} from './types';

/**
 * @private
 */
export interface OpenAIClientResponse<TData> {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data?: TData;
}

/**
 * @private
 */
export interface OpenAIClientOptions {
    apiKey: string;
    organization?: string;
    endpoint?: string;
    headerKey?: string;
    apiVersion?: string;
    ocpApimSubscriptionKey?: string;
}

/**
 * @private
 */
export class OpenAIClient {
    private _httpClient: AxiosInstance;

    private readonly DefaultEndpoint = 'https://api.openai.com';
    private readonly UserAgent = 'Microsoft Teams Conversational AI SDK';

    public constructor(options: OpenAIClientOptions) {
        this.options = options;

        // Cleanup and validate endpoint
        if (options.endpoint) {
            options.endpoint = options.endpoint.trim();
            if (options.endpoint.endsWith('/')) {
                options.endpoint = options.endpoint.substring(0, options.endpoint.length - 1);
            }
        }

        // Validate API key
        if (!options.apiKey) {
            throw new Error(`OpenAIClient initialized without an 'apiKey'.`);
        }

        // Create client and set headers
        this._httpClient = axios.create({
            validateStatus: (status) => status < 400 || status == 429
        });
    }

    public readonly options: OpenAIClientOptions;

    public createChatCompletion(
        request: CreateChatCompletionRequest
    ): Promise<OpenAIClientResponse<CreateChatCompletionResponse>> {
        const url = `${this.options.endpoint ?? this.DefaultEndpoint}/v1/chat/completions`;
        return this.post(url, request);
    }

    public createEmbedding(request: CreateEmbeddingRequest): Promise<OpenAIClientResponse<CreateEmbeddingResponse>> {
        const url = `${this.options.endpoint ?? this.DefaultEndpoint}/v1/embeddings`;
        return this.post(url, request);
    }

    public createModeration(request: CreateModerationRequest): Promise<OpenAIClientResponse<ModerationResponse>> {
        const url = `${this.options.endpoint ?? this.DefaultEndpoint}/v1/moderations`;
        return this.post(url, request);
    }

    protected addRequestHeaders(headers: Record<string, string>, options: OpenAIClientOptions): void {
        headers['Authorization'] = `Bearer ${options.apiKey}`;
        if (options.organization) {
            headers['OpenAI-Organization'] = options.organization;
        }
    }

    protected async post<TData>(url: string, body: object): Promise<OpenAIClientResponse<TData>> {
        // Initialize request headers
        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': this.UserAgent
        };
        this.addRequestHeaders(requestHeaders, this.options);

        // Send request
        const { status, statusText, data, headers } = await this._httpClient.post(url, body, {
            headers: requestHeaders
        });
        return { status, statusText, data, headers: headers as any };
    }
}
