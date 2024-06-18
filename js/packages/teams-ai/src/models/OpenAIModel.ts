/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { Message, PromptFunctions, PromptTemplate } from '../prompts';
import { PromptCompletionModel, PromptResponse } from './PromptCompletionModel';
import {
    ChatCompletionRequestMessage,
    Colorize,
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    OpenAICreateChatCompletionRequest
} from '../internals';
import { Tokenizer } from '../tokenizers';
import { TurnContext } from 'botbuilder';
import { Memory } from '../MemoryFork';

/**
 * Base model options common to both OpenAI and Azure OpenAI services.
 */
export interface BaseOpenAIModelOptions {
    /**
     * Optional. Whether to log requests to the console.
     * @remarks
     * This is useful for debugging prompts and defaults to `false`.
     */
    logRequests?: boolean;

    /**
     * Optional. Forces the model return a specific response format.
     * @remarks
     * This can be used to force the model to always return a valid JSON object.
     */
    responseFormat?: { type: 'json_object' };

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
     * Optional. A static seed to use when making model calls.
     * @remarks
     * The default is to use a random seed. Specifying a seed will make the model deterministic.
     */
    seed?: number;

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
 * Options for configuring a model that calls and `OpenAI` compliant endpoint.
 * @remarks
 * The endpoint should comply with the OpenAPI spec for OpenAI's API:
 *
 * https://github.com/openai/openai-openapi
 *
 * And an example of a compliant endpoint is LLaMA.cpp's reference server:
 *
 * https://github.com/ggerganov/llama.cpp/blob/master/examples/server/README.md
 */
export interface OpenAILikeModelOptions extends BaseOpenAIModelOptions {
    /**
     * Endpoint of the model server to call.
     */
    endpoint: string;

    /**
     * Default model to use for completions.
     */
    defaultModel: string;

    /**
     * Optional. API key to use when calling the models endpoint.
     */
    apiKey?: string;
}

/**
 * Options for configuring an `OpenAIModel` to call an Azure OpenAI hosted model.
 */
export interface AzureOpenAIModelOptions extends BaseOpenAIModelOptions {
    /**
     * API key to use when making requests to Azure OpenAI.
     */
    azureApiKey?: string;

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

    /**
     * Optional. A function that returns an access token for Microsoft Entra (formerly known as Azure Active Directory),
     * which will be invoked on every request.
     */
    azureADTokenProvider?: () => Promise<string>;
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
    public readonly options: OpenAIModelOptions | AzureOpenAIModelOptions | OpenAILikeModelOptions;

    /**
     * Creates a new `OpenAIModel` instance.
     * @param {OpenAIModelOptions} options - Options for configuring the model client.
     */
    public constructor(options: OpenAIModelOptions | AzureOpenAIModelOptions | OpenAILikeModelOptions) {
        // Check for azure config
        if ('azureApiKey' in options || 'azureADTokenProvider' in options) {
            this._useAzure = true;
            this.options = Object.assign(
                {
                    completion_type: 'chat',
                    retryPolicy: [2000, 5000],
                    azureApiVersion: '2023-05-15',
                    useSystemMessages: false
                },
                options
            ) as AzureOpenAIModelOptions;

            // Cleanup and validate endpoint
            let endpoint = this.options.azureEndpoint.trim();
            if (endpoint.endsWith('/')) {
                endpoint = endpoint.substring(0, endpoint.length - 1);
            }

            this.options.azureEndpoint = endpoint;
        } else {
            this._useAzure = false;
            this.options = Object.assign(
                {
                    completion_type: 'chat',
                    retryPolicy: [2000, 5000],
                    useSystemMessages: false
                },
                options
            ) as OpenAIModelOptions;
        }

        // Create client
        this._httpClient = axios.create({
            validateStatus: (status) => status < 400 || status == 429
        });
    }

    /**
     * Completes a prompt using OpenAI or Azure OpenAI.
     * @param {TurnContext} context - Current turn context.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {PromptFunctions} functions - Functions to use when rendering the prompt.
     * @param {Tokenizer} tokenizer - Tokenizer to use when rendering the prompt.
     * @param {PromptTemplate} template - Prompt template to complete.
     * @returns {Promise<PromptResponse<string>>} A `PromptResponse` with the status and message.
     */
    public async completePrompt(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate
    ): Promise<PromptResponse<string>> {
        const startTime = Date.now();
        const max_input_tokens = template.config.completion.max_input_tokens;
        const model =
            template.config.completion.model ??
            (this._useAzure
                ? (this.options as AzureOpenAIModelOptions).azureDefaultDeployment
                : (this.options as OpenAIModelOptions).defaultModel);
        // Render prompt
        const result = await template.prompt.renderAsMessages(context, memory, functions, tokenizer, max_input_tokens);
        if (result.tooLong) {
            return {
                status: 'too_long',
                input: undefined,
                error: new Error(
                    `The generated chat completion prompt had a length of ${result.length} tokens which exceeded the max_input_tokens of ${max_input_tokens}.`
                )
            };
        }
        if (!this.options.useSystemMessages && result.output.length > 0 && result.output[0].role == 'system') {
            result.output[0].role = 'user';
        }
        if (this.options.logRequests) {
            console.log(Colorize.title('CHAT PROMPT:'));
            console.log(Colorize.output(result.output));
        }

        // Get input message
        // - we're doing this here because the input message can be complex and include images.
        let input: Message<any> | undefined;
        const last = result.output.length - 1;
        if (last > 0 && result.output[last].role == 'user') {
            input = result.output[last];
        }

        // Initialize chat completion request
        const request: CreateChatCompletionRequest = this.copyOptionsToRequest<CreateChatCompletionRequest>(
            {
                messages: result.output as ChatCompletionRequestMessage[]
            },
            template.config.completion,
            [
                'max_tokens',
                'temperature',
                'top_p',
                'n',
                'stream',
                'logprobs',
                'echo',
                'stop',
                'presence_penalty',
                'frequency_penalty',
                'best_of',
                'logit_bias',
                'user',
                'functions',
                'function_call',
                'data_sources'
            ]
        );
        if (this.options.responseFormat) {
            request.response_format = this.options.responseFormat;
        }
        if (this.options.seed !== undefined) {
            request.seed = this.options.seed;
        }

        // Call chat completion API
        const response = await this.createChatCompletion(request, model);
        if (this.options.logRequests) {
            console.log(Colorize.title('CHAT RESPONSE:'));
            console.log(Colorize.value('status', response.status));
            console.log(Colorize.value('duration', Date.now() - startTime, 'ms'));
            console.log(Colorize.output(response.data));
        }

        // Process response
        if (response.status < 300) {
            const completion = response.data.choices[0];
            return { status: 'success', input, message: completion.message ?? { role: 'assistant', content: '' } };
        } else if (response.status == 429) {
            if (this.options.logRequests) {
                console.log(Colorize.title('HEADERS:'));
                console.log(Colorize.output(response.headers));
            }
            return {
                status: 'rate_limited',
                input: undefined,
                error: new Error(`The chat completion API returned a rate limit error.`)
            };
        } else {
            return {
                status: 'error',
                input: undefined,
                error: new Error(
                    `The chat completion API returned an error status of ${response.status}: ${response.statusText}`
                )
            };
        }
    }

    /**
     * @private
     * @template TRequest
     * @param {Partial<TRequest>} target - The target TRequest.
     * @param {any} src - The source object.
     * @param {string[]} fields - List of fields to copy.
     * @returns {TRequest} The TRequest
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
     * @param {CreateChatCompletionRequest} request - The request for Chat Completion
     * @param {string} model - The string name of the model.
     * @returns {Promise<AxiosResponse<CreateChatCompletionResponse>>} A Promise containing the CreateChatCompletionResponse response.
     */
    protected createChatCompletion(
        request: CreateChatCompletionRequest,
        model: string
    ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
        if (this._useAzure) {
            const options = this.options as AzureOpenAIModelOptions;
            const url = `${
                options.azureEndpoint
            }/openai/deployments/${model}/chat/completions?api-version=${options.azureApiVersion!}`;
            return this.post(url, request);
        } else {
            const options = this.options as OpenAIModelOptions;
            const url = `${options.endpoint ?? 'https://api.openai.com'}/v1/chat/completions`;
            (request as OpenAICreateChatCompletionRequest).model = model;
            return this.post(url, request);
        }
    }

    /**
     * @private
     * @template TData
     * @param {string} url - Url to post to.
     * @param {object} body - POST body.
     * @param {number} retryCount - Number of allowed retries.
     * @returns {Promise<AxiosResponse<TData>>} Promise containing the POST response.
     */
    protected async post<TData>(url: string, body: object, retryCount = 0): Promise<AxiosResponse<TData>> {
        // Initialize request config
        const requestConfig: AxiosRequestConfig = Object.assign({}, this.options.requestConfig);

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
            let apiKey = (this.options as AzureOpenAIModelOptions).azureApiKey;
            const azureADTokenProvider = (this.options as AzureOpenAIModelOptions).azureADTokenProvider;

            if (!apiKey && azureADTokenProvider) {
                apiKey = await azureADTokenProvider();
                requestConfig.headers['Authorization'] = `Bearer ${apiKey}`;
            } else {
                requestConfig.headers['api-key'] = apiKey || '';
            }
        } else if ('apiKey' in this.options) {
            requestConfig.headers['Authorization'] = `Bearer ${this.options.apiKey || ''}`;
        }

        if ('organization' in this.options && this.options.organization) {
            requestConfig.headers['OpenAI-Organization'] = this.options.organization;
        }

        try {
            const res = await this._httpClient.post(url, body, requestConfig);

            // Check for rate limit error
            if (
                res.status == 429 &&
                Array.isArray(this.options.retryPolicy) &&
                retryCount < this.options.retryPolicy.length
            ) {
                const delay = this.options.retryPolicy[retryCount];
                await new Promise((resolve) => setTimeout(resolve, delay));
                return this.post(url, body, retryCount + 1);
            }

            return res;
        } catch (err) {
            if (this.options.logRequests) {
                console.error(Colorize.error(err as Error));
            }

            throw err;
        }
    }
}
