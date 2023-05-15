/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    CreateCompletionRequest,
    CreateCompletionResponse,
    CreateEmbeddingRequest,
    CreateEmbeddingResponse,
    CreateModerationRequest,
    CreateModerationResponse
} from './schema';
import { OpenAIClient, OpenAIClientOptions, OpenAIClientResponse } from './OpenAIClient';

export interface AzureOpenAIClientOptions extends OpenAIClientOptions {
    endpoint: string;
    apiVersion?: string;
}

/**
 * `AzureOpenAIClient` Allows for Azure hosted OpenAI clients to be created and used. As of 4/4/2023, access keys must be specifically assigned to be used with this client.
 */
export class AzureOpenAIClient extends OpenAIClient {
    public constructor(options: AzureOpenAIClientOptions) {
        super(options);

        // Validate endpoint
        if (!options.endpoint) {
            throw new Error(`AzureOpenAIClient initialized without an 'endpoint'.`);
        }
    }

    public createCompletion(request: CreateCompletionRequest): Promise<OpenAIClientResponse<CreateCompletionResponse>> {
        const clone = Object.assign({}, request);
        const deployment = this.removeModel(clone);
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const apiVersion = (this.options as AzureOpenAIClientOptions).apiVersion ?? '2022-12-01';
        const url = `${endpoint}/openai/deployments/${deployment}/completions?api-version=${apiVersion}`;
        return this.post(url, clone);
    }

    public createChatCompletion(
        request: CreateChatCompletionRequest
    ): Promise<OpenAIClientResponse<CreateChatCompletionResponse>> {
        const clone = Object.assign({}, request);
        const deployment = this.removeModel(clone);
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const apiVersion = (this.options as AzureOpenAIClientOptions).apiVersion ?? '2023-03-15-preview';
        const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
        return this.post(url, clone);
    }

    public createEmbedding(request: CreateEmbeddingRequest): Promise<OpenAIClientResponse<CreateEmbeddingResponse>> {
        const clone = Object.assign({}, request);
        const deployment = this.removeModel(clone);
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const apiVersion = (this.options as AzureOpenAIClientOptions).apiVersion ?? '2022-12-01';
        const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
        return this.post(url, clone);
    }

    /**
     * Placeholder for future implementation.
     *
     * @param {CreateModerationRequest} request The input request and model payload.
     */
    public createModeration(request: CreateModerationRequest): Promise<OpenAIClientResponse<CreateModerationResponse>> {
        throw new Error(`the AzureOpenAIClient does not currently support calling the Moderation API.`);
    }

    protected addRequestHeaders(headers: Record<string, string>, options: OpenAIClientOptions): void {
        headers['api-key'] = options.apiKey;
    }

    private removeModel(request: { model?: string }): string {
        const model = request.model;
        delete request.model;

        if (model) {
            return model;
        } else {
            return '';
        }
    }
}
