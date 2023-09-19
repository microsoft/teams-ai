/* eslint-disable security/detect-object-injection */
/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AIApiFactory, AIApiFactoryOptions, createPlan } from './AIApiFactory';
import { DefaultTempState, DefaultTurnState } from './DefaultTurnStateManager';
import { TurnState } from './TurnState';
import { TurnContext } from 'botbuilder';
import { PromptTemplate } from './Prompts';
import { AI, ConfiguredAIOptions } from './AI';
import {
    ChatCompletionRequestMessage,
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    CreateCompletionRequest,
    CreateCompletionResponse,
    OpenAIClient,
    OpenAIClientResponse
} from './OpenAIClients';
import { Plan, PredictedDoCommand } from './Planner';
import { ConversationHistory } from './ConversationHistory';

export interface OpenAIApiFactoryOptions extends AIApiFactoryOptions {
    /**
     * The type of endpoint to use.
     */
    completionType?: 'chat' | 'text';

    /**
     * OpenAI API key.
     */
    apiKey: string;

    /**
     * Optional. OpenAI organization.
     */
    organization?: string;

    /**
     * Optional. OpenAI endpoint.
     */
    endpoint?: string;

    /**
     * The default model to use.
     * @summary
     * Prompts can override this model.
     */
    defaultModel: string;

    /**
     * Optional. A flag indicating if the planner should use the 'system' role when calling OpenAI's
     * chatCompletion API.
     * @summary
     * The planner current uses the 'user' role by default as this tends to generate more reliable
     * instruction following. Defaults to false.
     */
    useSystemMessage?: boolean;

    /**
     * Optional. A flag indicating if the planner should log requests to the console.
     * @summary
     * Both the prompt text and the completion response will be logged to the console. For
     * chatCompletion calls the outgoing messages array will also be logged.
     * Defaults to false.
     */
    logRequests?: boolean;
}

/**
 * @template TState Type of the turn state object being persisted.
 * @template TOptions Type of the options object being used.
 */
export class OpenAIApiFactory<TState extends TurnState = DefaultTurnState> implements AIApiFactory<TState> {
    private readonly _options: OpenAIApiFactoryOptions;
    private readonly _client: OpenAIClient;

    public constructor(options: OpenAIApiFactoryOptions) {
        this._options = Object.assign(
            {
                logRequests: false,
                oneSayPerTurn: false,
                useSystemMessage: false
            } as OpenAIApiFactoryOptions,
            options
        );
        this._client = this.createClient(this._options);
    }

    public async completePrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<string> {
        if (this._options.completionType === 'text') {
            const promptRequest = this.createCompletionRequest(prompt);
            const result = await this.createCompletion(promptRequest);
            return result.data?.choices[0]?.text ?? '';
        } else {
            const temp = (state['temp']?.value ?? {}) as DefaultTempState;
            const chatRequest = this.createChatCompletionRequest(state, prompt, temp.input, options);
            const result = await this.createChatCompletion(chatRequest);
            return result.data?.choices[0]?.message?.content ?? '';
        }
    }

    public async generatePlan(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan> {
        let status: number;
        let response: string;
        if (this._options.completionType === 'text') {
            const promptRequest = this.createCompletionRequest(prompt);
            const result = await this.createCompletion(promptRequest);
            status = result?.status;
            response = status === 200 ? result.data?.choices[0]?.text ?? '' : '';
        } else {
            const temp = (state['temp']?.value ?? {}) as DefaultTempState;
            const chatRequest = this.createChatCompletionRequest(state, prompt, temp.input, options);
            const result = await this.createChatCompletion(chatRequest);
            status = result?.status;
            response = status === 200 ? result.data?.choices[0]?.message?.content ?? '' : '';
        }

        // Ensure we weren't rate limited
        if (status === 429) {
            return {
                type: 'plan',
                commands: [
                    {
                        type: 'DO',
                        action: AI.RateLimitedActionName,
                        entities: {}
                    } as PredictedDoCommand
                ]
            };
        }

        return createPlan(response, options, this._options.oneSayPerTurn);
    }

    /**
     * Creates a chat completion request for the given prompt and user message.
     * @param {TState} state Application state for the current turn of conversation.
     * @param {PromptTemplate} prompt Prompt to complete.
     * @param {string} userMessage The user's message to include in the chat completion request.
     * @param {ConfiguredAIOptions<TState>} options Configuration options for the AI system.
     * @returns {CreateChatCompletionRequest} The chat completion request that was generated.
     * @private
     */
    private createChatCompletionRequest(
        state: TState,
        prompt: PromptTemplate,
        userMessage: string,
        options: ConfiguredAIOptions<TState>
    ): CreateChatCompletionRequest {
        // Clone prompt config
        const request: CreateChatCompletionRequest = Object.assign(
            {
                model: this.getModel(prompt),
                messages: []
            },
            prompt.config.completion as CreateChatCompletionRequest
        );
        this.patchStopSequences(request);

        // Populate system message
        request.messages.push({
            role: this._options.useSystemMessage ? 'system' : 'user',
            content: prompt.text
        });

        // Populate conversation history
        if (options.history.trackHistory) {
            /**
             * @type {string}
             */
            const userPrefix = options.history.userPrefix.trim().toLowerCase();
            /**
             * @type {string}
             */
            const assistantPrefix = options.history.assistantPrefix.trim().toLowerCase();
            const history = ConversationHistory.toArray(state, options.history.maxTokens);
            for (let i = 0; i < history.length; i++) {
                let line = history[i];
                const lcLine = line.toLowerCase();
                if (lcLine.startsWith(userPrefix)) {
                    line = line.substring(userPrefix.length).trim();
                    request.messages.push({
                        role: 'user',
                        content: line
                    });
                } else if (lcLine.startsWith(assistantPrefix)) {
                    line = line.substring(assistantPrefix.length).trim();
                    request.messages.push({
                        role: 'assistant',
                        content: line
                    });
                }
            }
        }

        // Add user message
        if (userMessage) {
            request.messages.push({
                role: 'user',
                content: userMessage
            });
        }

        return request;
    }

    /**
     * Creates a chat completion request for the given prompt and user message.
     * @param {CreateChatCompletionRequest} request The request to create a chat completion for.
     * @returns {Promise<OpenAIClientResponse<CreateChatCompletionResponse>>} The chat completion response.
     * @private
     */
    private async createChatCompletion(
        request: CreateChatCompletionRequest
    ): Promise<OpenAIClientResponse<CreateChatCompletionResponse>> {
        let response: OpenAIClientResponse<CreateChatCompletionResponse>;
        let error: { status?: number } = {};
        const startTime = new Date().getTime();
        try {
            response = await this._client.createChatCompletion(request);
        } catch (err: any) {
            error = err;
            throw err;
        } finally {
            if (this._options.logRequests) {
                const duration = new Date().getTime() - startTime;
                console.log(`\nCHAT REQUEST:\n\`\`\`\n${printChatMessages(request.messages)}\`\`\``);
                if (response!) {
                    if (response.status != 429) {
                        const choice =
                            Array.isArray(response?.data?.choices) &&
                            response.data &&
                            response.data.choices.length > 0 &&
                            response.data.choices[0].message?.content;
                        // TODO: if we add telemetry, we should log this
                        console.log(
                            `CHAT SUCCEEDED: status=${response.status} duration=${duration} prompt=${response?.data?.usage?.prompt_tokens} completion=${response?.data?.usage?.completion_tokens} response=${choice}`
                        );
                    } else {
                        console.error(
                            `CHAT FAILED due to rate limiting: status=${
                                response.status
                            } duration=${duration} headers=${JSON.stringify(response.headers)}`
                        );
                    }
                } else {
                    console.error(
                        `CHAT FAILED: status=${error?.status} duration=${duration} message=${error?.toString()}`
                    );
                }
            }
        }

        return response!;
    }

    /**
     * Creates a completion request for the given prompt.
     * @param {PromptTemplate} prompt The prompt to create the completion request for.
     * @returns {CreateCompletionRequest} The completion request that was generated.
     * @private
     */
    private createCompletionRequest(prompt: PromptTemplate): CreateCompletionRequest {
        // Clone prompt config
        const request: CreateCompletionRequest = Object.assign({}, prompt.config.completion as CreateCompletionRequest);
        this.patchStopSequences(request);
        request.model = this.getModel(prompt);
        request.prompt = prompt.text;
        return request;
    }

    /**
     * Creates a completion request for the given prompt.
     * @param {CreateCompletionRequest} request The request to create the completion for.
     * @returns {Promise<OpenAIClientResponse<CreateCompletionResponse>>} The completion response.
     * @private
     */
    private async createCompletion(
        request: CreateCompletionRequest
    ): Promise<OpenAIClientResponse<CreateCompletionResponse>> {
        /**
         * @type {OpenAIClientResponse<CreateCompletionResponse>}
         */
        let response: OpenAIClientResponse<CreateCompletionResponse>;
        let error: { status?: number } = {};
        const startTime = new Date().getTime();
        try {
            response = await this._client.createCompletion(request);
        } catch (err: any) {
            error = err;
            throw err;
        } finally {
            if (this._options.logRequests) {
                const duration = new Date().getTime() - startTime;
                console.log(`\nPROMPT REQUEST:\n\`\`\`\n${request.prompt}\`\`\``);
                if (response!) {
                    if (response.status != 429) {
                        const choice =
                            Array.isArray(response?.data?.choices) && response.data && response.data.choices.length > 0
                                ? response.data.choices[0].text
                                : '';
                        // TODO: telemetry
                        console.log(
                            `PROMPT SUCCEEDED: status=${response.status} duration=${duration} prompt=${response.data!
                                .usage?.prompt_tokens} completion=${response.data!.usage
                                ?.completion_tokens} response=${choice}`
                        );
                    } else {
                        console.error(
                            `PROMPT FAILED: status=${response.status} duration=${duration} headers=${JSON.stringify(
                                response.headers
                            )}`
                        );
                    }
                } else {
                    console.error(
                        `PROMPT FAILED: status=${error?.status} duration=${duration} message=${error?.toString()}`
                    );
                }
            }
        }

        return response!;
    }

    /**
     * Creates a new OpenAI client with the provided options.
     * @param {TOptions} options The options to use when creating the client.
     * @returns {OpenAIClient} The newly created OpenAI client.
     */
    private createClient(options: OpenAIApiFactoryOptions): OpenAIClient {
        /**
         * @param {string} options.apiKey The API key to use when authenticating with OpenAI.
         * @param {string} options.organization The organization ID to use when authenticating with OpenAI.
         * @param {string} options.endpoint The endpoint to use when making requests to OpenAI.
         */
        return new OpenAIClient({
            apiKey: options.apiKey,
            organization: options.organization,
            endpoint: options.endpoint
        });
    }

    /**
     * Returns the model to use for the given prompt.
     * @param {PromptTemplate} prompt The prompt to get the model for.
     * @returns {string} The model to use for the given prompt.
     */
    private getModel(prompt: PromptTemplate): string {
        /**
         * @param {string[]} prompt.config.default_backends The default backends to use for the prompt.
         */
        if (Array.isArray(prompt.config.default_backends) && prompt.config.default_backends.length > 0) {
            return prompt.config.default_backends[0];
        } else {
            return this._options.defaultModel;
        }
    }

    /**
     * @param {any} request The request to patch stop sequences for.
     * @private
     */
    private patchStopSequences(request: any): void {
        if (request['stop_sequences']) {
            request.stop = request['stop_sequences'];
            delete request['stop_sequences'];
        }
    }
}

/**
 * Prints the chat messages from a chat completion request.
 * @param {ChatCompletionRequestMessage[]} messages The messages to print.
 * @returns {string} The formatted chat messages.
 * @private
 */
function printChatMessages(messages: ChatCompletionRequestMessage[]): string {
    let text = '';
    for (let i = 0; i < messages.length; i++) {
        switch (messages[i].role) {
            case 'system':
                text += messages[i].content + '\n';
                break;
            default:
                text += `\n${messages[i].role}: ${messages[i].content}`;
                break;
        }
    }
    return text;
}
