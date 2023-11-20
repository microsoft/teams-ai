/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { PromptFunctions, PromptTemplate } from "../prompts";
import { PromptCompletionModel, PromptResponse } from "./PromptCompletionModel";
import { ChatCompletionRequestMessage, CreateChatCompletionRequest, CreateChatCompletionResponse, CreateCompletionRequest, CreateCompletionResponse, OpenAICreateChatCompletionRequest, OpenAICreateCompletionRequest } from "../internals";
import { Tokenizer } from "../tokenizers";
import { Colorize } from "../internals";
import { TurnContext } from 'botbuilder';
import { Memory } from '../MemoryFork';

/**
 * Base model options common to both OpenAI and Azure OpenAI services.
 */
export interface BaseOpenAIModelOptions {
    /**
     * Optional. Type of completion to use for the default model. Defaults to 'chat'.
     */
    completion_type?: 'chat' | 'text';

    /**
     * Optional. Whether to log requests to the console.
     * @remarks
     * This is useful for debugging prompts and defaults to `false`.
     */
    logRequests?: boolean;

    /**
     * Optional. Retry policy to use when calling the OpenAI API.
     * @remarks
     * The default retry policy is `[2000, 5000]` which means that the first retry will be after
     * 2 seconds and the second retry will be after 5 seconds.
     */
    retryPolicy?: number[];

    /**
     * Optional. Request options to use when calling the OpenAI API.
     */
    requestConfig?: AxiosRequestConfig;

    /**
     * Optional. Whether to use `system` messages when calling the OpenAI API.
     * @remarks
     * The current generation of models tend to follow instructions from `user` messages better
     * then `system` messages so the default is `false`, which causes any `system` message in the
     * prompt to be sent as `user` messages instead.
     */
    useSystemMessages?: boolean;
}

/**
 * Options for configuring an `OpenAIModel` to call an OpenAI hosted model.
 */
export interface OpenAIModelOptions extends BaseOpenAIModelOptions {
    /**
     * API key to use when calling the OpenAI API.
     * @remarks
     * A new API key can be created at https://platform.openai.com/account/api-keys.
     */
    apiKey: string;

    /**
     * Default model to use for completions.
     */
    defaultModel: string;

    /**
     * Optional. Organization to use when calling the OpenAI API.
     */
    organization?: string;

    /**
     * Optional. Endpoint to use when calling the OpenAI API.
     * @remarks
     * For Azure OpenAI this is the deployment endpoint.
     */
    endpoint?: string;
}

/**
 * Options for configuring an `OpenAIModel` to call an Azure OpenAI hosted model.
 */
export interface AzureOpenAIModelOptions extends BaseOpenAIModelOptions {
    /**
     * API key to use when making requests to Azure OpenAI.
     */
    azureApiKey: string;

    /**
     * Default name of the Azure OpenAI deployment (model) to use.
     */
    azureDefaultDeployment: string;

    /**
     * Deployment endpoint to use.
     */
    azureEndpoint: string;

    /**
     * Optional. Version of the API being called. Defaults to `2023-05-15`.
     */
    azureApiVersion?: string;
}

/**
 * A `PromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.
 */
export class OpenAIModel implements PromptCompletionModel {
    private readonly _httpClient: AxiosInstance;
    private readonly _useAzure: boolean;

    private readonly UserAgent = '@microsoft/teams-ai-v1';

    /**
     * Options the client was configured with.
     */
    public readonly options: OpenAIModelOptions|AzureOpenAIModelOptions;

    /**
     * Creates a new `OpenAIModel` instance.
     * @param options Options for configuring the model client.
     */
    public constructor(options: OpenAIModelOptions|AzureOpenAIModelOptions) {
        // Check for azure config
        if ((options as AzureOpenAIModelOptions).azureApiKey) {
            this._useAzure = true;
            this.options = Object.assign({
                completion_type: 'chat',
                retryPolicy: [2000, 5000],
                azureApiVersion: '2023-05-15',
                useSystemMessages: false
            }, options) as AzureOpenAIModelOptions;

            // Cleanup and validate endpoint
            let endpoint = this.options.azureEndpoint.trim();
            if (endpoint.endsWith('/')) {
                endpoint = endpoint.substring(0, endpoint.length - 1);
            }

            if (!endpoint.toLowerCase().startsWith('https://')) {
                throw new Error(`Model created with an invalid endpoint of '${endpoint}'. The endpoint must be a valid HTTPS url.`);
            }

            this.options.azureEndpoint = endpoint;
        } else {
            this._useAzure = false;
            this.options = Object.assign({
                completion_type: 'chat',
                retryPolicy: [2000, 5000],
                useSystemMessages: false
            }, options) as OpenAIModelOptions;
        }

        // Create client
        this._httpClient = axios.create({
            validateStatus: (status) => status < 400 || status == 429
        });
    }

    /**
     * Completes a prompt using OpenAI or Azure OpenAI.
     * @param context Current turn context.
     * @param memory An interface for accessing state values.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param template Prompt template to complete.
     * @returns A `PromptResponse` with the status and message.
     */
    public async completePrompt(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, template: PromptTemplate): Promise<PromptResponse<string>> {
        const startTime = Date.now();
        const max_input_tokens = template.config.completion.max_input_tokens;
        if (this.options.completion_type == 'text') {
            // Render prompt
            const result = await template.prompt.renderAsText(context, memory, functions, tokenizer, max_input_tokens);
            if (result.tooLong) {
                return { status: 'too_long', error: new Error(`The generated text completion prompt had a length of ${result.length} tokens which exceeded the max_input_tokens of ${max_input_tokens}.`) };
            }
            if (this.options.logRequests) {
                console.log(Colorize.title('PROMPT:'));
                console.log(Colorize.output(result.output));
            }

            // Call text completion API
            const request: CreateCompletionRequest = this.copyOptionsToRequest<CreateCompletionRequest>({
                prompt: result.output,
            }, this.options, ['max_tokens', 'temperature', 'top_p', 'n', 'stream', 'logprobs', 'echo', 'stop', 'presence_penalty', 'frequency_penalty', 'best_of', 'logit_bias', 'user']);
            const response = await this.createCompletion(request);
            if (this.options.logRequests) {
                console.log(Colorize.title('RESPONSE:'));
                console.log(Colorize.value('status', response.status));
                console.log(Colorize.value('duration', Date.now() - startTime, 'ms'));
                console.log(Colorize.output(response.data));
            }

            // Process response
            if (response.status < 300) {
                const completion = response.data.choices[0];
                return { status: 'success', message: { role: 'assistant', content: completion.text ?? '' } };
            } else if (response.status == 429) {
                if (this.options.logRequests) {
                    console.log(Colorize.title('HEADERS:'));
                    console.log(Colorize.output(response.headers));
                }
                return { status: 'rate_limited', error: new Error(`The text completion API returned a rate limit error.`) }
            } else {
                return { status: 'error', error: new Error(`The text completion API returned an error status of ${response.status}: ${response.statusText}`) };
            }
        } else {
            // Render prompt
            const result = await template.prompt.renderAsMessages(context, memory, functions, tokenizer, max_input_tokens);
            if (result.tooLong) {
                return { status: 'too_long', error: new Error(`The generated chat completion prompt had a length of ${result.length} tokens which exceeded the max_input_tokens of ${max_input_tokens}.`) };
            }
            if (!this.options.useSystemMessages && result.output.length > 0 && result.output[0].role == 'system') {
                result.output[0].role = 'user';
            }
            if (this.options.logRequests) {
                console.log(Colorize.title('CHAT PROMPT:'));
                console.log(Colorize.output(result.output));
            }

            // Call chat completion API
            const request: CreateChatCompletionRequest = this.copyOptionsToRequest<CreateChatCompletionRequest>({
                messages: result.output as ChatCompletionRequestMessage[],
            }, this.options, ['max_tokens', 'temperature', 'top_p', 'n', 'stream', 'logprobs', 'echo', 'stop', 'presence_penalty', 'frequency_penalty', 'best_of', 'logit_bias', 'user', 'functions', 'function_call']);
            const response = await this.createChatCompletion(request);
            if (this.options.logRequests) {
                console.log(Colorize.title('CHAT RESPONSE:'));
                console.log(Colorize.value('status', response.status));
                console.log(Colorize.value('duration', Date.now() - startTime, 'ms'));
                console.log(Colorize.output(response.data));
            }

            // Process response
            if (response.status < 300) {
                const completion = response.data.choices[0];
                return { status: 'success', message: completion.message ?? { role: 'assistant', content: '' } };
            } else if (response.status == 429) {
                if (this.options.logRequests) {
                    console.log(Colorize.title('HEADERS:'));
                    console.log(Colorize.output(response.headers));
                }
                return { status: 'rate_limited', error: new Error(`The chat completion API returned a rate limit error.`) }
            } else {
                return { status: 'error', error: new Error(`The chat completion API returned an error status of ${response.status}: ${response.statusText}`) };
            }
        }
    }

    /**
     * @private
     */
    protected copyOptionsToRequest<TRequest>(target: Partial<TRequest>, src: any, fields: string[]): TRequest {
        for (const field of fields) {
            if (src[field] !== undefined) {
                (target as any)[field] = src[field];
            }
        }

        return target as TRequest;
    }

    /**
     * @private
     */
    protected createCompletion(request: CreateCompletionRequest): Promise<AxiosResponse<CreateCompletionResponse>> {
        if (this._useAzure) {
            const options = this.options as AzureOpenAIModelOptions;
            const url = `${options.azureEndpoint}/openai/deployments/${options.azureDefaultDeployment}/completions?api-version=${options.azureApiVersion!}`;
            return this.post(url, request);
        } else {
            const options = this.options as OpenAIModelOptions;
            const url = `${options.endpoint ?? 'https://api.openai.com'}/v1/completions`;
            (request as OpenAICreateCompletionRequest).model = options.defaultModel;
            return this.post(url, request);
        }
    }

    /**
     * @private
     */
    protected createChatCompletion(request: CreateChatCompletionRequest): Promise<AxiosResponse<CreateChatCompletionResponse>> {
        if (this._useAzure) {
            const options = this.options as AzureOpenAIModelOptions;
            const url = `${options.azureEndpoint}/openai/deployments/${options.azureDefaultDeployment}/chat/completions?api-version=${options.azureApiVersion!}`;
            return this.post(url, request);
        } else {
            const options = this.options as OpenAIModelOptions;
            const url = `${options.endpoint ?? 'https://api.openai.com'}/v1/chat/completions`;
            (request as OpenAICreateChatCompletionRequest).model = options.defaultModel;
            return this.post(url, request);
        }
    }

    /**
     * @private
     */
    protected async post<TData>(url: string, body: object, retryCount = 0): Promise<AxiosResponse<TData>> {
        // Initialize request config
        const requestConfig: AxiosRequestConfig = Object.assign({}, this.options.requestConfig);

        // Initialize request headers
        if (!requestConfig.headers) {
            requestConfig.headers = {};
        }
        if (!requestConfig.headers['Content-Type']) {
            requestConfig.headers['Content-Type'] = 'application/json';
        }
        if (!requestConfig.headers['User-Agent']) {
            requestConfig.headers['User-Agent'] = this.UserAgent;
        }
        if (this._useAzure) {
            const options = this.options as AzureOpenAIModelOptions;
            requestConfig.headers['api-key'] = options.azureApiKey;
        } else {
            const options = this.options as OpenAIModelOptions;
            requestConfig.headers['Authorization'] = `Bearer ${options.apiKey}`;
            if (options.organization) {
                requestConfig.headers['OpenAI-Organization'] = options.organization;
            }
        }

        // Send request
        const response = await this._httpClient.post(url, body, requestConfig);

        // Check for rate limit error
        if (response.status == 429 && Array.isArray(this.options.retryPolicy) && retryCount < this.options.retryPolicy.length) {
            const delay = this.options.retryPolicy[retryCount];
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.post(url, body, retryCount + 1);
        } else {
            return response;
        }
    }
}
