/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientOptions, AzureOpenAI, OpenAI } from 'openai';
import { 
    ChatCompletionCreateParams, 
    ChatCompletionMessageParam
} from 'openai/resources';
import { AxiosRequestConfig } from 'axios';
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
     * @deprecated
     * Optional. Retry policy to use when calling the OpenAI API.
     * @remarks
     * Use `maxRetries` instead.
     */
    retryPolicy?: number[];

    /**
     * Optional. Maximum number of retries to use when calling the OpenAI API.
     * @remarks
     * The default is to retry twice.
     */
    maxRetries?: number;

    /**
     * @deprecated
     * Optional. Request options to use when calling the OpenAI API.
     * @abstract
     * Use `clientOptions` instead.
     */
    requestConfig?: AxiosRequestConfig;

    /**
     * Optional. Custom client options to use when calling the OpenAI API.
     */
    clientOptions?: ClientOptions;

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
<<<<<<< Updated upstream
=======

    /**
     * Optional. Whether the models responses should be streamed back using Server Sent Events (SSE.)
     * @remarks
     * Defaults to `false`.
     */
    stream?: boolean;
>>>>>>> Stashed changes
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
    private readonly _client: OpenAI;
    private readonly _useAzure: boolean;

    private readonly UserAgent = '@microsoft/teams-ai-v1';

    /**
     * Options the client was configured with.
     */
    public readonly options: OpenAIModelOptions | AzureOpenAIModelOptions;

    /**
     * Creates a new `OpenAIModel` instance.
     * @param {OpenAIModelOptions} options - Options for configuring the model client.
     */
    public constructor(options: OpenAIModelOptions | AzureOpenAIModelOptions) {
        // Handle deprecated options
        if (options.maxRetries == undefined && options.retryPolicy != undefined) {
            console.warn(`OpenAIModel: The 'retryPolicy' option is deprecated. Use 'maxRetries' instead.`);
            options.maxRetries = options.retryPolicy.length;
        }
        if (options.clientOptions == undefined && options.requestConfig != undefined) {
            console.warn(`OpenAIModel: The 'requestConfig' option is deprecated. Use 'clientOptions' instead.`);
            options.clientOptions = {
                timeout: options.requestConfig.timeout,
                httpAgent: options.requestConfig.httpsAgent ?? options.requestConfig.httpAgent,
                defaultHeaders: options.requestConfig.headers as any 
            };
        }

        // Check for azure config
        if ((options as AzureOpenAIModelOptions).azureApiKey) {
            // Initialize options
            this.options = Object.assign(
                {
                    completion_type: 'chat',
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

            if (!endpoint.toLowerCase().startsWith('https://')) {
                throw new Error(
                    `Model created with an invalid endpoint of '${endpoint}'. The endpoint must be a valid HTTPS url.`
                );
            }
            this.options.azureEndpoint = endpoint;

            // Create client
            this._useAzure = true;
            this._client = new AzureOpenAI(Object.assign(
                {}, 
                this.options.clientOptions, 
                { 
                    apiKey: this.options.azureApiKey,
                    endpoint: this.options.azureEndpoint,
                    apiVersion: this.options.azureApiVersion 
                }
            ));
        } else {
            // Initialize options
            this.options = Object.assign(
                {
                    completion_type: 'chat',
                    useSystemMessages: false
                },
                options
            ) as OpenAIModelOptions;

            // Create client
            this._useAzure = false;
            this._client = new OpenAI(Object.assign(
                {},
                this.options.clientOptions,
                {
                    apiKey: this.options.apiKey,
                    baseURL: this.options.endpoint,
                    organization: this.options.organization,
                }
            ));
        }
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
        
        // Check for legacy completion type  
        if (template.config.type == 'completion') {
            throw new Error(`The completion type 'completion' is no longer supported. Only 'chat' based models are supported.`);
        }

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

        const stream = await this._client.chat.completions.create({stream: true});
        const iterator = stream[Symbol.asyncIterator]();

        for await (const chunk of stream) {
        }

        // Initialize chat completion params
        const params: ChatCompletionCreateParams = this.copyOptionsToRequest<ChatCompletionCreateParams>(
            {
                messages: result.output as ChatCompletionMessageParam[]
            },
            template.config.completion,
            [
                'max_tokens',
                'temperature',
                'top_p',
                'n',
                'stream',
                'logprobs',
                'top_logprobs',
                'stop',
                'presence_penalty',
                'frequency_penalty',
                'logit_bias',
                'user',
                'functions',
                'function_call',
<<<<<<< Updated upstream
                'data_sources'
=======
                'data_sources',
                'response_format',
                'seed',
                'tool_choice',
                'tools'
>>>>>>> Stashed changes
            ]
        );
        if (this.options.responseFormat) {
            params.response_format = this.options.responseFormat;
        }
        if (this.options.seed !== undefined) {
            params.seed = this.options.seed;
        }
        if (this.options.stream) {
            params.stream = true;
        }
        params.model = model;

        // Call chat completion API
        const response = await this._client.chat.completions.create(params);
        if (params.stream) {

        } else {

        }
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
        } else if ((this.options as OpenAIModelOptions).apiKey) {
            const options = this.options as OpenAIModelOptions;
            requestConfig.headers['Authorization'] = `Bearer ${options.apiKey}`;
            if (options.organization) {
                requestConfig.headers['OpenAI-Organization'] = options.organization;
            }
        }

        // Send request
        const response = await this._httpClient.post(url, body, requestConfig);

        // Check for rate limit error
        if (
            response.status == 429 &&
            Array.isArray(this.options.retryPolicy) &&
            retryCount < this.options.retryPolicy.length
        ) {
            const delay = this.options.retryPolicy[retryCount];
            await new Promise((resolve) => setTimeout(resolve, delay));
            return this.post(url, body, retryCount + 1);
        } else {
            return response;
        }
    }

    private createClient(options: OpenAIModelOptions | AzureOpenAIModelOptions | OpenAILikeModelOptions): OpenAI {
        return new OpenAI()
        if (this._useAzure) {
            const azureOptions = options as AzureOpenAIModelOptions;
            return new OpenAI({
                apiKey: azureOptions.azureApiKey,
                endpoint: azureOptions.azureEndpoint,
                organization: azureOptions.azureDefaultDeployment
            });
        } else {
            const openAIOptions = options as OpenAIModelOptions;
            return new OpenAI({
                apiKey: openAIOptions.apiKey,
                defaultModel: openAIOptions.defaultModel,
                organization: openAIOptions.organization,
                endpoint: openAIOptions.endpoint
            });
        }
    }
}
