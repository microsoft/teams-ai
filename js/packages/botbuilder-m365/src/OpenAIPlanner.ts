/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PredictedDoCommand, Planner, Plan } from './Planner';
import { TurnState } from './TurnState';
import { DefaultTempState, DefaultTurnState } from './DefaultTurnStateManager';
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

export class OpenAIPlanner<TState extends TurnState = DefaultTurnState>
    implements Planner<TState>
{
    private readonly _options: OpenAIPlannerOptions;
    private readonly _configuration: Configuration;
    private readonly _openai: OpenAIApi;

    public constructor(options: OpenAIPlannerOptions) {
        this._options = Object.assign({
            oneSayPerTurn: false,
            useSystemMessage: false,
            logRequests: false
        } as OpenAIPlannerOptions, options);
        this._configuration = new Configuration(options.configuration);
        this._openai = new OpenAIApi(this._configuration, options.basePath, options.axios as any);
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

    public async completePrompt(
        context: TurnContext, 
        state: TState, 
        prompt: PromptTemplate, 
        options: ConfiguredAIOptions<TState>
    ): Promise<string> {
        // Check for chat completion model
        const model = this.getModel(prompt);
        if (model.startsWith('gpt-3.5-turbo')) {
            // Request base chat completion
            const temp = (state['temp']?.value ?? {}) as DefaultTempState;
            const chatRequest = this.createChatCompletionRequest(
                state,
                prompt,
                temp.input,
                options
            );
            const result = await this.createChatCompletion(chatRequest);
            return result?.data?.choices ? result.data.choices[0]?.message?.content : undefined;
        } else {
            // Request base prompt completion
            const promptRequest = this.createCompletionRequest(prompt);
            const result = await this.createCompletion(promptRequest);
            return result?.data?.choices ? result.data.choices[0]?.text : undefined;
        }
       
    }

    public async generatePlan(
        context: TurnContext, 
        state: TState, 
        prompt: PromptTemplate, 
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan> {
        // Check for chat completion model
        let status: number;
        let response: string;
        const model = this.getModel(prompt);
        if (model.startsWith('gpt-3.5-turbo')) {
            // Request base chat completion
            const temp = (state['temp']?.value ?? {}) as DefaultTempState;
            const chatRequest = await this.createChatCompletionRequest(
                state,
                prompt,
                temp.input,
                options
            );
            const result = await this.createChatCompletion(chatRequest);
            status = result?.status;
            response = result?.data?.choices ? result.data.choices[0]?.message?.content : undefined;
        } else {
            // Request base prompt completion
            const promptRequest = this.createCompletionRequest(prompt);
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
            if (options.history.assistantPrefix) {
                // The model sometimes predicts additional text for the human side of things so skip that.
                const pos = response.toLowerCase().indexOf(options.history.assistantPrefix.toLowerCase());
                if (pos >= 0) {
                    response = response.substring(pos + options.history.assistantPrefix.length);
                }
            }

            // Parse response into commands
            const plan = ResponseParser.parseResponse(response.trim());

            // Filter to only a single SAY command
            if (this._options.oneSayPerTurn) {
                let spoken = false;
                plan.commands = plan.commands.filter((cmd) => {
                    if (cmd.type == 'SAY') {
                        if (spoken) {
                            return false;
                        }

                        spoken = true;
                    }

                    return true;
                });
            }

            return plan;
        }

        // Return an empty plan by default
        return { type: 'plan', commands: [] };
    }

    private getModel(prompt: PromptTemplate): string {
        if (Array.isArray(prompt.config.default_backends) && prompt.config.default_backends.length > 0) {
            return prompt.config.default_backends[0];
        } else {
            return this._options.defaultModel;
        }
    }

    private createChatCompletionRequest(
        state: TState,
        prompt: PromptTemplate,
        userMessage: string,
        options: ConfiguredAIOptions<TState>
    ): CreateChatCompletionRequest {
        // Clone prompt config
        const request: CreateChatCompletionRequest = Object.assign({
            model: this.getModel(prompt),
            messages: []
        }, prompt.config.completion as CreateChatCompletionRequest);
        this.patchStopSequences(request);

        // Populate system message
        request.messages.push({
            role: this._options.useSystemMessage ? 'system' : 'user',
            content: prompt.text
        });

        // Populate conversation history
        if (options.history.trackHistory) {
            const userPrefix = options.history.userPrefix.trim().toLowerCase();
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

    private createCompletionRequest(prompt: PromptTemplate): CreateCompletionRequest {
        // Clone prompt config
        const request: CreateCompletionRequest = Object.assign({}, prompt.config.completion as CreateCompletionRequest);
        this.patchStopSequences(request);
        request.model = this.getModel(prompt);
        request.prompt = prompt.text;
        return request;
    }

    private patchStopSequences(request: any): void {
        if (request['stop_sequences']) {
            request.stop = request['stop_sequences'];
            delete request['stop_sequences'];
        }
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
                            `CHAT FAILED: status=${response.status} duration=${duration} headers=${JSON.stringify(
                                response.headers
                            )}`
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

    private async createCompletion(request: CreateCompletionRequest): Promise<AxiosResponse<CreateCompletionResponse>> {
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
}

/**
 * @param messages
 */
function printChatMessages(messages: ChatCompletionRequestMessage[]): string {
    let text = '';
    messages.forEach((msg) => {
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
