/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PredictedDoCommand, PredictedSayCommand, Planner, Plan } from './Planner';
import { TurnState } from './TurnState';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { TurnContext } from 'botbuilder';
import {
    Configuration,
    ConfigurationParameters,
    OpenAIApi,
    CreateCompletionRequest,
    CreateCompletionResponse,
    CreateChatCompletionRequest,
    CreateChatCompletionResponse,
    ChatCompletionRequestMessage
} from 'openai';
import { AxiosInstance, AxiosResponse } from 'axios';
import { ResponseParser } from './ResponseParser';
import { ConversationHistory } from './ConversationHistory';
import { AI, ConfiguredAIOptions } from './AI';
import { PromptTemplate } from './Prompts';

export interface OpenAIPlannerOptions {
    configuration: ConfigurationParameters;
    defaultModel: string;
    basePath?: string;
    axios?: AxiosInstance;
    oneSayPerTurn?: boolean;
    useSystemMessage?: boolean;
    logRequests?: boolean;
}

export interface OpenAIConversationHistoryOptions {
    addTurnToHistory?: boolean;
    userPrefix?: string;
    botPrefix?: string;
    maxLines?: number;
    maxCharacterLength?: number;
    includePlanJson?: boolean;
}

export class OpenAIPlanner<TState extends TurnState = DefaultTurnState>
    implements Planner<TState>
{
    private readonly _options: OpenAIPlannerOptions;
    private readonly _configuration: Configuration;
    private readonly _openai: OpenAIApi;

    public constructor(options: OpenAIPlannerOptions) {
        this._options = Object.assign({
            oneSayPerTurn: true,
            logRequests: false
        } as OpenAIPlannerOptions, options);
        this._configuration = new Configuration(options.configuration);
        this._openai = new OpenAIApi(this._configuration, options.basePath, options.axios as any);

        // Initialize conversation history
        this._options.conversationHistory = Object.assign(
            {
                addTurnToHistory: true,
                userPrefix: 'Human: ',
                botPrefix: 'AI: ',
                includePlanJson: true
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

    public get options(): OpenAIPlannerOptions {
        return this._options;
    }

    public async expandPromptTemplate(context: TurnContext, state: TState, prompt: string): Promise<string> {
        return PromptParser.expandPromptTemplate(context, state, prompt, {
                conversationHistory: this._options.conversationHistory
            });
    }

    public async prompt(
        context: TurnContext,
        state: TState,
        options: OpenAIPromptOptions,
        message?: string
    ): Promise<string|undefined> {
        // Check for chat completion model
        if (options.promptConfig.model.startsWith('gpt-3.5-turbo')) {

            // Request base chat completion
            const chatRequest = await this.createChatCompletionRequest(
                context,
                state,
                options.prompt,
                options.promptConfig,
                message,
                options.conversationHistory
            );

            const result = await this.createChatCompletion(chatRequest);
            return result?.data?.choices ? result.data.choices[0]?.message?.content : undefined;
        } else {
            // Request base prompt completion
            const promptRequest = await this.createCompletionRequest(
                context,
                state,
                options.prompt,
                options.promptConfig,
                options.conversationHistory
            );

            const result = await this.createCompletion(promptRequest);
            return result?.data?.choices ? result.data.choices[0]?.text : undefined;
        }
    }



    public async completePrompt(context: TurnContext, state: TState, prompt: PromptTemplate, options?: ConfiguredAIOptions<TState>): Promise<string> {
        // Check for chat completion model
        const model = prompt.config.
        if (options.promptConfig.model.startsWith('gpt-3.5-turbo')) {

            // Request base chat completion
            const chatRequest = await this.createChatCompletionRequest(
                context,
                state,
                options.prompt,
                options.promptConfig,
                message,
                options.conversationHistory
            );

            const result = await this.createChatCompletion(chatRequest);
            return result?.data?.choices ? result.data.choices[0]?.message?.content : undefined;
        } else {
            // Request base prompt completion
            const promptRequest = await this.createCompletionRequest(
                context,
                state,
                options.prompt,
                options.promptConfig,
                options.conversationHistory
            );

            const result = await this.createCompletion(promptRequest);
            return result?.data?.choices ? result.data.choices[0]?.text : undefined;
        }
       
    }

    public async generatePlan(context: TurnContext, state: TState, prompt: PromptTemplate, options?: ConfiguredAIOptions): Promise<Plan> {
        
    }

    public async gentePlan(
        context: TurnContext,
        state: TState,
        options?: OpenAIPromptOptions,
        message?: string
    ): Promise<Plan> {
        options = options ?? (this._options as OpenAIPromptOptions);

        if (!options.prompt || !options.promptConfig) {
            throw new Error(`OpenAIPredictionEngine: "prompt" or "promptConfiguration" not specified.`);
        }

        // Check for chat completion model
        let status: number;
        let response: string;
        if (options.promptConfig.model.startsWith('gpt-3.5-turbo')) {
            // Request base chat completion
            const chatRequest = await this.createChatCompletionRequest(
                context,
                state,
                options.prompt,
                options.promptConfig,
                message ?? context.activity.text,
                options.conversationHistory
            );

            const result = await this.createChatCompletion(chatRequest);
            status = result?.status;
            response = result?.data?.choices ? result.data.choices[0]?.message?.content : undefined;
        } else {
            // Request base prompt completion
            const promptRequest = await this.createCompletionRequest(
                context,
                state,
                options.prompt,
                options.promptConfig,
                options.conversationHistory
            );

            const result = await this.createCompletion(promptRequest);
            status = result?.status;
            response = result?.data?.choices ? result.data.choices[0]?.text : undefined;
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

        // Parse returned prompt response
        if (response) {
            // Patch the occasional "Then DO" which gets predicted
            response = response.trim().replace('Then DO ', 'THEN DO ').replace('Then SAY ', 'THEN SAY ');
            if (response.startsWith('THEN ')) {
                response = response.substring(5);
            }

            // Remove response prefix
            const historyOptions = options.conversationHistory ?? {};
            if (historyOptions.botPrefix) {
                // The model sometimes predicts additional text for the human side of things so skip that.
                const pos = response.toLowerCase().indexOf(historyOptions.botPrefix.toLowerCase());
                if (pos >= 0) {
                    response = response.substring(pos + historyOptions.botPrefix.length);
                }
            }

            // Parse response into commands
            const plan = ResponseParser.parseResponse(response.trim());
            
            // Filter to only a single SAY command
            if (this._options.oneSayPerTurn) {
                let spoken = false;
                plan.commands = plan.commands.filter(cmd => {
                    if (cmd.type == 'SAY') {
                        if (spoken) {
                            return false;
                        }

                        spoken = true;
                    }

                    return true;
                });
            }

            // Add turn to conversation history
            if (historyOptions.addTurnToHistory) {
                if (context.activity.text) {
                    ConversationHistory.addLine(
                        state,
                        `${historyOptions.userPrefix ?? ''}${context.activity.text}`,
                        historyOptions.maxLines
                    );
                }
                if (historyOptions.includePlanJson) {
                    ConversationHistory.addLine(
                        state,
                        `${historyOptions.botPrefix ?? ''}${JSON.stringify(plan)}`,
                        historyOptions.maxLines
                    );
                } else {
                    const text = plan.commands.filter(v => v.type == 'SAY').map(v => (v as PredictedSayCommand).response).join('\n');
                    ConversationHistory.addLine(
                        state,
                        `${historyOptions.botPrefix ?? ''}${text}`,
                        historyOptions.maxLines
                    );
                }
            }

            return plan;
        }

        return { type: 'plan', commands: [] };
    }

    private async createChatCompletionRequest(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        config: OpenAIPromptConfig,
        userMessage?: string,
        historyOptions?: OpenAIConversationHistoryOptions
    ): Promise<CreateChatCompletionRequest> {
        // Clone prompt config
        const request: CreateChatCompletionRequest = Object.assign({
            messages: []
        } as CreateChatCompletionRequest, config);

        // Expand prompt template
        // - NOTE: While the local history options and the prompts expected history options are
        //         different types, they're compatible via duck typing. This could impact porting.
        const systemMsg = await PromptParser.expandPromptTemplate(context, state, prompt, {
            conversationHistory: historyOptions
        });

        // Populate system message
        request.messages.push({
            role: config.useSystemMessage ? 'system' : 'user',
            content: systemMsg
        });

        // Populate conversation history
        if (historyOptions) {
            const userPrefix = (historyOptions.userPrefix ?? 'Human: ').toLowerCase();
            const botPrefix = (historyOptions.botPrefix ?? 'AI: ').toLowerCase();
            const history = ConversationHistory.toArray(state, historyOptions.maxCharacterLength);
            for (let i = 0; i < history.length; i++) {
                let line = history[i];
                const lcLine = line.toLowerCase();
                if (lcLine.startsWith(userPrefix)) {
                    line = line.substring(userPrefix.length).trim();
                    request.messages.push({
                        role: 'user',
                        content: line
                    });
                } else if (lcLine.startsWith(botPrefix)) {
                    line = line.substring(botPrefix.length).trim();
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

    private async createCompletionRequest(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        config: CreateCompletionRequest,
        historyOptions?: OpenAIConversationHistoryOptions
    ): Promise<CreateCompletionRequest> {
        // Clone prompt config
        const request = Object.assign({}, config);

        // Expand prompt template
        // - NOTE: While the local history options and the prompts expected history options are
        //         different types, they're compatible via duck typing. This could impact porting.
        request.prompt = await PromptParser.expandPromptTemplate(context, state, prompt, {
            conversationHistory: historyOptions
        });

        return request;
    }

    private async createChatCompletion(
        request: CreateChatCompletionRequest
    ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
        let response: AxiosResponse<CreateChatCompletionResponse>;
        let error: { status?: number } = {};
        const startTime = new Date().getTime();
        try {
            response = (await this._openai.createChatCompletion(request, {
                validateStatus: (status) => status < 400 || status == 429
            })) as any;
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
                            Array.isArray(response?.data?.choices) && response.data.choices.length > 0
                                ? response.data.choices[0].message.content
                                : '';
                        console.log(
                            `CHAT SUCCEEDED: status=${response.status} duration=${duration} prompt=${response.data.usage?.prompt_tokens} completion=${response.data.usage?.completion_tokens} response=${choice}`
                        );
                    } else {
                        console.error(
                            `CHAT FAILED: status=${
                                response.status
                            } duration=${duration} headers=${JSON.stringify(response.headers)}`
                        );
                    }
                } else {
                    console.error(
                        `CHAT FAILED: status=${
                            error?.status
                        } duration=${duration} message=${error?.toString()}`
                    );
                }
            }
        }

        return response!;
    }


    private async createCompletion(
        request: CreateCompletionRequest
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
                console.log(`\nPROMPT REQUEST:\n\`\`\`\n${request.prompt}\`\`\``);
                if (response!) {
                    if (response.status != 429) {
                        const choice =
                            Array.isArray(response?.data?.choices) && response.data.choices.length > 0
                                ? response.data.choices[0].text
                                : '';
                        console.log(
                            `PROMPT SUCCEEDED: status=${response.status} duration=${duration} prompt=${response.data.usage?.prompt_tokens} completion=${response.data.usage?.completion_tokens} response=${choice}`
                        );
                    } else {
                        console.error(
                            `PROMPT FAILED: status=${
                                response.status
                            } duration=${duration} headers=${JSON.stringify(response.headers)}`
                        );
                    }
                } else {
                    console.error(
                        `PROMPT FAILED: status=${
                            error?.status
                        } duration=${duration} message=${error?.toString()}`
                    );
                }
            }
        }

        return response!;
    }
}

function printChatMessages(messages: ChatCompletionRequestMessage[]): string {
    let text = '';
    messages.forEach(msg => {
        switch (msg.role) {
            case 'system':
                text += msg.content + '\n';
                break;
            default:
                text += `\n${msg.role}: ${msg.content}`;
                break;
        }
    });

    return text;
}
