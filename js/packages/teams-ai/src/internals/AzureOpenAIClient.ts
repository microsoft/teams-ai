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
    ModerationInput,
    ModerationResponse,
    OpenAICreateChatCompletionRequest,
    OpenAICreateCompletionRequest,
    OpenAICreateEmbeddingRequest
} from './types';
import { OpenAIClient, OpenAIClientOptions, OpenAIClientResponse } from './OpenAIClient';

/**
 * @private
 */
export interface AzureOpenAIClientOptions extends OpenAIClientOptions {
    /**
     * Azure OpenAI endpoint.
     */
    endpoint: string;

    /**
     * Optional. Which Azure API version to use. Defaults to latest.
     */
    apiVersion?: string;
}

/**
 * @private
 * @class
 * @implements {OpenAIClient}
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
        const clone = Object.assign({}, request) as OpenAICreateCompletionRequest;
        const deployment = this.removeModel(clone);
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const apiVersion = (this.options as AzureOpenAIClientOptions).apiVersion ?? '2022-12-01';
        const url = `${endpoint}/openai/deployments/${deployment}/completions?api-version=${apiVersion}`;
        return this.post(url, clone);
    }

    public createChatCompletion(
        request: CreateChatCompletionRequest
    ): Promise<OpenAIClientResponse<CreateChatCompletionResponse>> {
        const clone = Object.assign({}, request) as OpenAICreateChatCompletionRequest;
        const deployment = this.removeModel(clone);
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const apiVersion = (this.options as AzureOpenAIClientOptions).apiVersion ?? '2023-03-15-preview';
        const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;
        return this.post(url, clone);
    }

    public createEmbedding(request: CreateEmbeddingRequest): Promise<OpenAIClientResponse<CreateEmbeddingResponse>> {
        const clone = Object.assign({}, request) as OpenAICreateEmbeddingRequest;
        const deployment = this.removeModel(clone);
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const apiVersion = (this.options as AzureOpenAIClientOptions).apiVersion ?? '2022-12-01';
        const url = `${endpoint}/openai/deployments/${deployment}/embeddings?api-version=${apiVersion}`;
        return this.post(url, clone);
    }

    public createModeration(request: ModerationInput): Promise<OpenAIClientResponse<ModerationResponse>> {
        const endpoint = (this.options as AzureOpenAIClientOptions).endpoint;
        const url = `${endpoint}/contentsafety/text:analyze?api-version=${
            (this.options as AzureOpenAIClientOptions).apiVersion
        }`;
        return this.post(url, request);
    }

    protected addRequestHeaders(headers: Record<string, string>, options: OpenAIClientOptions): void {
        headers[options.headerKey ?? 'api-key'] = options.apiKey;
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
