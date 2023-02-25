/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PredictedCommand, PredictedDoCommand, PredictionEngine } from './PredictionEngine';
import { TurnState } from './TurnState';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { TurnContext } from 'botbuilder';
import {
    Configuration,
    ConfigurationParameters,
    OpenAIApi,
    CreateCompletionRequest,
    CreateCompletionResponse
} from 'openai';
import { AxiosInstance, AxiosResponse } from 'axios';
import { ResponseParser } from './ResponseParser';
import { PromptParser, PromptTemplate } from './PromptParser';
import { ConversationHistory } from './ConversationHistory';
import { AI } from './AI';

export interface OpenAIPromptOptions {
    prompt: PromptTemplate;
    promptConfig: CreateCompletionRequest;
    conversationHistory?: OpenAIConversationHistoryOptions;
    logRequests?: boolean;
}

export interface OpenAIPredictionOptions extends OpenAIPromptOptions {
    topicFilter?: PromptTemplate;
    topicFilterConfig?: CreateCompletionRequest;
}

export interface OpenAIPredictionEngineOptions {
    configuration: ConfigurationParameters;
    basePath?: string;
    axios?: AxiosInstance;
    prompt?: PromptTemplate;
    promptConfig?: CreateCompletionRequest;
    topicFilter?: PromptTemplate;
    topicFilterConfig?: CreateCompletionRequest;
    conversationHistory?: OpenAIConversationHistoryOptions;
    logRequests?: boolean;
}

export interface OpenAIConversationHistoryOptions {
    addTurnToHistory?: boolean;
    userPrefix?: string;
    botPrefix?: string;
    maxLines?: number;
    maxCharacterLength?: number;
    lineSeparator?: string;
}

export class OpenAIPredictionEngine<TState extends TurnState = DefaultTurnState>
    implements PredictionEngine<TState, OpenAIPredictionOptions>
{
    private readonly _options: OpenAIPredictionEngineOptions;
    private readonly _configuration: Configuration;
    private readonly _openai: OpenAIApi;

    public constructor(options: OpenAIPredictionEngineOptions) {
        this._options = Object.assign({} as OpenAIPredictionEngineOptions, options);
        this._configuration = new Configuration(options.configuration);
        this._openai = new OpenAIApi(this._configuration, options.basePath, options.axios as any);

        // Initialize conversation history
        this._options.conversationHistory = Object.assign(
            {
                addTurnToHistory: true,
                userPrefix: 'Human: ',
                botPrefix: 'AI: '
            } as OpenAIConversationHistoryOptions,
            this._options.conversationHistory
        );
    }

    public get configuration(): Configuration {
        return this._configuration;
    }

    public get openai(): OpenAIApi {
        return this._openai;
    }

    public get options(): OpenAIPredictionEngineOptions {
        return this._options;
    }

    public async expandPromptTemplate(context: TurnContext, state: TState, prompt: string): Promise<string> {
        return PromptParser.expandPromptTemplate(context, state, {}, prompt, {
                conversationHistory: this._options.conversationHistory
            });
    }

    public async prompt(
        context: TurnContext,
        state: TState,
        options: OpenAIPromptOptions,
        data?: Record<string, any>
    ): Promise<string|undefined> {
        data = data ?? {};

        // Request base prompt completion
        const promptRequest = await this.createCompletionRequest(
            context,
            state,
            data,
            options.prompt,
            options.promptConfig,
            options.conversationHistory
        );

        const result = await this.createCompletion(promptRequest, 'PROMPT');
        return result?.data?.choices ? result.data.choices[0]?.text : undefined;
    }

    public async predictCommands(
        context: TurnContext,
        state: TState,
        data?: Record<string, any>,
        options?: OpenAIPredictionOptions
    ): Promise<PredictedCommand[]> {
        data = data ?? {};
        options = options ?? (this._options as OpenAIPredictionOptions);

        if (!options.prompt || !options.promptConfig) {
            throw new Error(`OpenAIPredictionEngine: "prompt" or "promptConfiguration" not specified.`);
        }

        // Request base prompt completion
        const promises: Promise<AxiosResponse<CreateCompletionResponse>>[] = [];
        const promptRequest = await this.createCompletionRequest(
            context,
            state,
            data,
            options.prompt,
            options.promptConfig,
            options.conversationHistory
        );
        promises.push(this.createCompletion(promptRequest, 'PROMPT') as any);

        // Add optional topic filter completion
        if (options.topicFilter) {
            if (!options.topicFilterConfig) {
                throw new Error(
                    `OpenAIPredictionEngine: a "topicFilter" prompt was specified but the "topicFilterConfig" is missing.`
                );
            }

            const topicFilterRequest = await this.createCompletionRequest(
                context,
                state,
                data,
                options.topicFilter,
                options.topicFilterConfig,
                options.conversationHistory
            );
            promises.push(this.createCompletion(topicFilterRequest, 'TOPIC FILTER') as any);
        }

        // Wait for completions to finish
        const results = await Promise.all(promises);

        // Ensure we weren't rate limited
        for (let i = 0; i < results.length; i++) {
            if (results[i].status == 429) {
                return [
                    {
                        type: 'DO',
                        action: AI.RateLimitedActionName,
                        data: {}
                    } as PredictedDoCommand
                ];
            }
        }

        // Check topic filter
        if (results.length > 1) {
            if (results[1].status != 429) {
                // Look for the word "yes" to be in the topic filters response.
                let allowed = false;
                if (results[1]?.data?.choices && results[1].data.choices.length > 0) {
                    allowed = (results[1].data.choices[0].text ?? '').toLowerCase().indexOf('yes') >= 0;
                }

                // Redirect to OffTopic action if not allowed
                if (!allowed) {
                    return [
                        {
                            type: 'DO',
                            action: AI.OffTopicActionName,
                            data: {}
                        } as PredictedDoCommand
                    ];
                }
            }
        }

        // Parse returned prompt response
        if (Array.isArray(results[0]?.data?.choices) && results[0].data.choices.length > 0) {
            // Remove response prefix
            let response = results[0].data.choices[0].text ?? '';
            const historyOptions = options.conversationHistory ?? {};
            if (historyOptions.botPrefix) {
                // The model sometimes predicts additional text for the human side of things so skip that.
                const pos = response.toLowerCase().indexOf(historyOptions.botPrefix.toLowerCase());
                if (pos >= 0) {
                    response = response.substring(pos + historyOptions.botPrefix.length);
                }
            }

            // Parse response into commands
            const commands = ResponseParser.parseResponse(response.trim());

            // Add turn to conversation history
            if (historyOptions.addTurnToHistory) {
                if (context.activity.text) {
                    ConversationHistory.addLine(
                        state,
                        `${historyOptions.userPrefix ?? ''}${context.activity.text}`,
                        historyOptions.maxLines
                    );
                }
                if (response) {
                    ConversationHistory.addLine(
                        state,
                        `${historyOptions.botPrefix ?? ''}${response}`,
                        historyOptions.maxLines
                    );
                }
            }
            return commands;
        }

        return [];
    }

    private async createCompletionRequest(
        context: TurnContext,
        state: TState,
        data: Record<string, any>,
        prompt: PromptTemplate,
        config: CreateCompletionRequest,
        historyOptions?: OpenAIConversationHistoryOptions
    ): Promise<CreateCompletionRequest> {
        // Clone prompt config
        const request = Object.assign({}, config);

        // Expand prompt template
        // - NOTE: While the local history options and the prompts expected history options are
        //         different types, they're compatible via duck typing. This could impact porting.
        request.prompt = await PromptParser.expandPromptTemplate(context, state, data, prompt, {
            conversationHistory: historyOptions
        });

        return request;
    }

    private async createCompletion(
        request: CreateCompletionRequest,
        promptType: string
    ): Promise<AxiosResponse<CreateCompletionResponse>> {
        let response: AxiosResponse<CreateCompletionResponse>;
        let error: { status?: number } = {};
        const startTime = new Date().getTime();
        try {
            response = (await this._openai.createCompletion(request, {
                validateStatus: (status) => status < 400 || status == 429
            })) as any;
        } catch (err: any) {
            error = err;
            throw err;
        } finally {
            if (this._options.logRequests) {
                const duration = new Date().getTime() - startTime;
                console.log(`\n${promptType} REQUEST:\n\`\`\`\n${request.prompt}\`\`\``);
                if (response!) {
                    if (response.status != 429) {
                        const choice =
                            Array.isArray(response?.data?.choices) && response.data.choices.length > 0
                                ? response.data.choices[0].text
                                : '';
                        console.log(
                            `${promptType} SUCCEEDED: status=${response.status} duration=${duration} response=${choice}`
                        );
                    } else {
                        console.error(
                            `${promptType} FAILED: status=${
                                response.status
                            } duration=${duration} headers=${JSON.stringify(response.headers)}`
                        );
                    }
                } else {
                    console.error(
                        `${promptType} FAILED: status=${
                            error?.status
                        } duration=${duration} message=${error?.toString()}`
                    );
                }
            }
        }

        return response!;
    }
}
