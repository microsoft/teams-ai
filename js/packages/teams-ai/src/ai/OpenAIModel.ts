import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';
import { PromptFunctions, PromptMemory, PromptSection, Tokenizer } from "promptrix";
import { PromptCompletionModel, PromptResponse, ChatCompletionFunction } from "./ai/types";
import { ChatCompletionRequestMessage, CreateChatCompletionRequest, CreateChatCompletionResponse, CreateCompletionRequest, CreateCompletionResponse, OpenAICreateChatCompletionRequest, OpenAICreateCompletionRequest } from "./internals";
import { Colorize } from "./internals";

/**
 * Base model options common to both OpenAI and Azure OpenAI services.
 */
export interface BaseOpenAIModelOptions {
    /**
     * Type of completion API to call.
     */
    completion_type: 'text' | 'chat';

    /**
     * Optional. Maximum number of tokens to let the prompt use when rendering.
     * @remarks
     * Defaults to `1024`.
     *
     * If the rendered prompt exceeds this limit, most `PromptCompletionClient` classes will return
     * a `response.status == 'too_long'`.
     */
    max_input_tokens?: number;

    /**
     * Optional. What sampling temperature to use, between `0` and `2`.
     * @remarks
     * Higher values like `0.8` will make the output more random, while lower values like `0.2` will
     * make it more focused and deterministic.
     *
     * It's generally recommended to use this or `top_p` but not both.
     */
    temperature?: number;

    /**
     * Optional. An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass.
     * @remarks
     * A value of `0.1` means only the tokens comprising the top 10% probability mass are considered.
     *
     * It's generally recommended to use this or `temperature` but not both.
     */
    top_p?: number;

    /**
     * Optional. The maximum number of tokens to generate for a completion.
     * @remarks
     * This value plus the `max_input_tokens` value cannot exceed the maximum number of tokens for
     * the models context window.
     */
    max_tokens?: number;

    /**
     * Optional. Up to 4 sequences where the API will stop generating further tokens.
     * @remarks
     * The returned text will not contain the stop sequence.
     */
    stop?: Array<string> | string;

    /**
     * Optional. Presence penalty value between `-2.0` and `2.0`.
     * @remarks
     * Positive values penalize new tokens based on whether they appear in the text so far,
     * increasing the model's likelihood to talk about new topics.
     */
    presence_penalty?: number;

    /**
     * Optional. Frequency penalty value between `-2.0` and `2.0`.
     * @remarks
     * Positive values penalize new tokens based on their existing frequency in the text so far,
     * decreasing the model's likelihood to repeat the same line verbatim.
     */
    frequency_penalty?: number;

    /**
     * Optional. Logit bias modifies the likelihood of specified tokens appearing in the completion.
     */
    logit_bias?: object;

    /**
     * Optional. Number of candidate completions to generate server side.
     */
    best_of?: number;

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
     * Optional. A list of functions the model may generate JSON inputs for.
     */
    functions?: ChatCompletionFunction[];

    /**
     * Optional. Controls how the model responds to function calls.
     * @remarks
     * `"none"` means the model does not call a function, and responds to the end-user.
     * `"auto"` means the model can pick between an end-user or calling a function.
     * Specifying a particular function via `{"name":\ "my_function"}` forces the model to call that function.
     * `"none"` is the default when no functions are present.
     * `"auto"` is the default if functions are present.
     */
    function_call?: { name: string; } | 'none' | 'auto';
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
     * Model to use for completion.
     * @remarks
     * For Azure OpenAI this is the name of the deployment to use.
     */
    model: string;

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
     * Deployment endpoint to use.
     */
    azureEndpoint: string;

    /**
     * Name of the Azure OpenAI deployment (model) to use.
     */
    azureDeployment: string;

    /**
     * Optional. Version of the API being called. Defaults to `2023-05-15`.
     */
    azureApiVersion?: string;
}

/**
 * A `PromptCompletionModel` for calling OpenAI and Azure OpenAI hosted models.
 * @remarks
 */
export class OpenAIModel implements PromptCompletionModel {
    private readonly _httpClient: AxiosInstance;
    private readonly _useAzure: boolean;

    private readonly UserAgent = 'AlphaWave';

    /**
     * Options the client was configured with.
     */
    public readonly options: OpenAIModelOptions|AzureOpenAIModelOptions;

    /**
     * Creates a new `OpenAIClient` instance.
     * @param options Options for configuring an `OpenAIClient`.
     */
    public constructor(options: OpenAIModelOptions|AzureOpenAIModelOptions) {
        // Check for azure config
        if ((options as AzureOpenAIModelOptions).azureApiKey) {
            this._useAzure = true;
            this.options = Object.assign({
                retryPolicy: [2000, 5000],
                azureApiVersion: '2023-05-15',
            }, options) as AzureOpenAIModelOptions;

            // Cleanup and validate endpoint
            let endpoint = this.options.azureEndpoint.trim();
            if (endpoint.endsWith('/')) {
                endpoint = endpoint.substring(0, endpoint.length - 1);
            }

            if (!endpoint.toLowerCase().startsWith('https://')) {
                throw new Error(`Client created with an invalid endpoint of '${endpoint}'. The endpoint must be a valid HTTPS url.`);
            }

            this.options.azureEndpoint = endpoint;
        } else {
            this._useAzure = false;
            this.options = Object.assign({
                retryPolicy: [2000, 5000]
            }, options) as OpenAIModelOptions;
        }

        // Create client
        this._httpClient = axios.create({
            validateStatus: (status) => status < 400 || status == 429
        });
    }

    /**
     * Creates a new `OpenAIModel` instance with the specified options merged with the current options.
     * @param options New options to merge with the current options.
     * @returns Cloned `OpenAIModel` instance.
     */
    public clone(options: Partial<OpenAIModelOptions|AzureOpenAIModelOptions>): OpenAIModel {
        return new OpenAIModel(Object.assign({}, this.options, options));
    }

    /**
     * Completes a prompt using the OpenAI API.
     * @remarks
     * The API used, Chat Completion or Text Completion, will be determined by the `this.options.completion_type` property.
     * @param memory Memory to use when rendering the prompt.
     * @param functions Functions to use when rendering the prompt.
     * @param tokenizer Tokenizer to use when rendering the prompt.
     * @param prompt Prompt to complete.
     * @returns A `PromptResponse` with the status and message.
     */
    public async completePrompt(memory: PromptMemory, functions: PromptFunctions, tokenizer: Tokenizer, prompt: PromptSection): Promise<PromptResponse> {
        const startTime = Date.now();
        const max_input_tokens = this.options.max_input_tokens ?? 1024;
        if (this.options.completion_type == 'text') {
            // Render prompt
            const result = await prompt.renderAsText(memory, functions, tokenizer, max_input_tokens);
            if (result.tooLong) {
                return { status: 'too_long', message: `The generated text completion prompt had a length of ${result.length} tokens which exceeded the max_input_tokens of ${max_input_tokens}.` };
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
                return { status: 'rate_limited', message: `The text completion API returned a rate limit error.` }
            } else {
                return { status: 'error', message: `The text completion API returned an error status of ${response.status}: ${response.statusText}` };
            }
        } else {
            // Render prompt
            const result = await prompt.renderAsMessages(memory, functions, tokenizer, max_input_tokens);
            if (result.tooLong) {
                return { status: 'too_long', message: `The generated chat completion prompt had a length of ${result.length} tokens which exceeded the max_input_tokens of ${max_input_tokens}.` };
            }
            if (this.options.logRequests) {
                console.log(Colorize.title('CHAT PROMPT:'));
                console.log(Colorize.output(result.output));
                if (Array.isArray(this.options.functions) && this.options.functions.length > 0) {
                    console.log(Colorize.title('FUNCTIONS:'));
                    console.log(Colorize.output(this.options.functions));
                }
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
                return { status: 'rate_limited', message: `The chat completion API returned a rate limit error.` }
            } else {
                return { status: 'error', message: `The chat completion API returned an error status of ${response.status}: ${response.statusText}` };
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
            const url = `${options.azureEndpoint}/openai/deployments/${options.azureDeployment}/completions?api-version=${options.azureApiVersion!}`;
            return this.post(url, request);
        } else {
            const options = this.options as OpenAIModelOptions;
            const url = `${options.endpoint ?? 'https://api.openai.com'}/v1/completions`;
            (request as OpenAICreateCompletionRequest).model = options.model;
            return this.post(url, request);
        }
    }

    /**
     * @private
     */
    protected createChatCompletion(request: CreateChatCompletionRequest): Promise<AxiosResponse<CreateChatCompletionResponse>> {
        if (this._useAzure) {
            const options = this.options as AzureOpenAIModelOptions;
            const url = `${options.azureEndpoint}/openai/deployments/${options.azureDeployment}/chat/completions?api-version=${options.azureApiVersion!}`;
            return this.post(url, request);
        } else {
            const options = this.options as OpenAIModelOptions;
            const url = `${options.endpoint ?? 'https://api.openai.com'}/v1/chat/completions`;
            (request as OpenAICreateChatCompletionRequest).model = options.model;
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
