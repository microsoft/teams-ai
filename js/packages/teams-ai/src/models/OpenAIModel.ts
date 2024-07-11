/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AxiosRequestConfig } from 'axios';
import { TurnContext } from 'botbuilder';
import EventEmitter from 'events';
import { ClientOptions, AzureOpenAI, OpenAI } from 'openai';
import {
    ChatCompletionCreateParams,
    ChatCompletionMessageParam,
    ChatCompletionChunk,
    ChatCompletion
} from 'openai/resources';
import { Stream } from 'openai/streaming';

import { Colorize } from '../internals';
import { Memory } from '../MemoryFork';
import { Message, PromptFunctions, PromptTemplate } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { PromptResponse } from '../types';

import { PromptCompletionModel, PromptCompletionModelEmitter } from './PromptCompletionModel';

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

    /**
     * Optional. Whether the models responses should be streamed back using Server Sent Events (SSE.)
     * @remarks
     * Defaults to `false`.
     */
    stream?: boolean;
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

    /**
     * Optional. Project to use when calling the OpenAI API.
     */
    project?: string;
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
    private readonly _events: PromptCompletionModelEmitter = new EventEmitter() as PromptCompletionModelEmitter;
    private readonly _client: OpenAI;
    private readonly _useAzure: boolean;

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
        if (
            (options as AzureOpenAIModelOptions).azureApiKey ||
            (options as AzureOpenAIModelOptions).azureADTokenProvider
        ) {
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
            // - NOTE: we're not passing in a deployment as that hardcodes the deployment used.
            this._useAzure = true;
            this._client = new AzureOpenAI(
                Object.assign({}, this.options.clientOptions, {
                    apiKey: this.options.azureApiKey,
                    endpoint: this.options.azureEndpoint,
                    apiVersion: this.options.azureApiVersion,
                    adTokenProvider: this.options.azureADTokenProvider
                })
            );
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
            this._client = new OpenAI(
                Object.assign({}, this.options.clientOptions, {
                    apiKey: this.options.apiKey,
                    baseURL: this.options.endpoint,
                    organization: this.options.organization ?? null,
                    project: this.options.project ?? null
                })
            );
        }
    }

    /**
     * Events emitted by the model.
     * @returns {PromptCompletionModelEmitter} The events emitted by the model.
     */
    public get events(): PromptCompletionModelEmitter {
        return this._events;
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
            throw new Error(
                `The completion type 'completion' is no longer supported. Only 'chat' based models are supported.`
            );
        }

        // Signal start of completion
        const streaming = this.options.stream;
        this._events.emit('beforeCompletion', context, memory, functions, tokenizer, template, !!streaming);

        // Render prompt
        const result = await template.prompt.renderAsMessages(context, memory, functions, tokenizer, max_input_tokens);
        if (result.tooLong) {
            return this.returnTooLong(max_input_tokens, result.length);
        }

        // Check for use of system messages
        // - 'user' messages tend to be followed better by the model then 'system' messages.
        if (!this.options.useSystemMessages && result.output.length > 0 && result.output[0].role == 'system') {
            result.output[0].role = 'user';
        }

        // Log the generated prompt
        if (this.options.logRequests) {
            console.log(Colorize.title('CHAT PROMPT:'));
            console.log(Colorize.output(result.output));
        }

        // Get input message
        // - we're doing this here because the input message can be complex and include images.
        const input = this.getInputMessage(result.output);

        try {
            // Call chat completion API
            let message: Message<string>;
            const params = this.getChatCompletionParams(model, result.output, template);
            const completion = await this._client.chat.completions.create(params);
            if (params.stream) {
                // Log start of streaming
                if (this.options.logRequests) {
                    console.log(Colorize.title('STREAM STARTED:'));
                }

                // Enumerate the streams chunks
                message = { role: 'assistant', content: '' };
                for await (const chunk of completion as Stream<ChatCompletionChunk>) {
                    const delta: ChatCompletionChunk.Choice.Delta = chunk.choices[0]?.delta || {};
                    if (delta.role) {
                        message.role = delta.role;
                    }
                    if (delta.content) {
                        message.content += delta.content;
                    }
                    // TODO: handle tool calls
                    // if (delta.tool_calls) {
                    //     message.tool_calls = delta.tool_calls;
                    // }

                    // Signal chunk received
                    if (this.options.logRequests) {
                        console.log(Colorize.value('CHUNK', delta));
                    }
                    this._events.emit('chunkReceived', context, memory, { delta: delta as Partial<Message<string>> });
                }

                // Log stream completion
                console.log(Colorize.title('STREAM COMPLETED:'));
                console.log(Colorize.value('duration', Date.now() - startTime, 'ms'));
            } else {
                // Log the generated response
                message = ((completion as ChatCompletion).choices[0]?.message as Message<string>) ?? {
                    role: 'assistant',
                    content: ''
                };
                if (this.options.logRequests) {
                    console.log(Colorize.title('CHAT RESPONSE:'));
                    console.log(Colorize.value('duration', Date.now() - startTime, 'ms'));
                    console.log(Colorize.output(message));
                }
            }

            // Signal response received
            const response: PromptResponse<string> = { status: 'success', input, message };
            this._events.emit('responseReceived', context, memory, response);
            return response;
        } catch (err: unknown) {
            return this.returnError(err, input);
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
    private copyOptionsToRequest<TRequest>(target: Partial<TRequest>, src: any, fields: string[]): TRequest {
        for (const field of fields) {
            if (src[field] !== undefined) {
                (target as any)[field] = src[field];
            }
        }

        return target as TRequest;
    }

    /**
     * @private
     * @param {string} model - Model to use.
     * @param {Message<string>[]} messages - Messages to send.
     * @param {PromptTemplate} template Prompt template being used.
     * @returns {ChatCompletionCreateParams} Chat completion parameters.
     */
    private getChatCompletionParams(
        model: string,
        messages: Message<string>[],
        template: PromptTemplate
    ): ChatCompletionCreateParams {
        const params: ChatCompletionCreateParams = this.copyOptionsToRequest<ChatCompletionCreateParams>(
            {
                messages: messages as ChatCompletionMessageParam[]
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
                'data_sources',
                'response_format',
                'seed',
                'tool_choice',
                'tools'
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

        return params;
    }

    private getInputMessage(messages: Message<string>[]): Message<string> | undefined {
        const last = messages.length - 1;
        if (last > 0 && messages[last].role == 'user') {
            return messages[last];
        }

        return undefined;
    }

    private returnTooLong(max_input_tokens: number, length: number): PromptResponse<string> {
        return {
            status: 'too_long',
            input: undefined,
            error: new Error(
                `The generated chat completion prompt had a length of ${length} tokens which exceeded the max_input_tokens of ${max_input_tokens}.`
            )
        };
    }

    private returnError(err: unknown, input: Message<string> | undefined): PromptResponse<string> {
        if (err instanceof OpenAI.APIError) {
            if (err.status == 429) {
                if (this.options.logRequests) {
                    console.log(Colorize.title('HEADERS:'));
                    console.log(Colorize.output(err.headers as any));
                }
                return {
                    status: 'rate_limited',
                    input,
                    error: new Error(`The chat completion API returned a rate limit error.`)
                };
            } else {
                return {
                    status: 'error',
                    input,
                    error: new Error(`The chat completion API returned an error status of ${err.status}: ${err.name}`)
                };
            }
        } else {
            return {
                status: 'error',
                input,
                error: new Error(`The chat completion API returned an error: ${(err as Error).toString()}`)
            };
        }
    }
}
