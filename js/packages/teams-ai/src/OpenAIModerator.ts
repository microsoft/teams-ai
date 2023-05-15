/* eslint-disable security/detect-object-injection */
/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Plan, PredictedDoCommand, PredictedSayCommand } from './Planner';
import { TurnState } from './TurnState';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { TurnContext } from 'botbuilder';
import { OpenAIClient, CreateModerationResponseResultsInner } from './OpenAIClients';
import { PromptTemplate } from './Prompts';
import { Moderator } from './Moderator';
import { ConfiguredAIOptions, AI } from './AI';

export interface OpenAIModeratorOptions {
    apiKey: string;
    moderate: 'input' | 'output' | 'both';
    organization?: string;
    endpoint?: string;
    model?: string;
}

export class OpenAIModerator<TState extends TurnState = DefaultTurnState> implements Moderator<TState> {
    private readonly _options: OpenAIModeratorOptions;
    private readonly _client: OpenAIClient;

    public constructor(options: OpenAIModeratorOptions) {
        this._options = Object.assign({}, options);
        this._client = this.createClient(this._options);
    }

    public async reviewPrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan | undefined> {
        switch (this._options.moderate) {
            case 'input':
            case 'both': {
                const input = state?.temp?.value.input ?? context.activity.text;
                const result = await this.createModeration(input, this._options.model);
                if (result) {
                    if (result.flagged) {
                        // Input flagged
                        return {
                            type: 'plan',
                            commands: [
                                {
                                    type: 'DO',
                                    action: AI.FlaggedInputActionName,
                                    entities: result
                                } as PredictedDoCommand
                            ]
                        };
                    }
                } else {
                    // Rate limited
                    return {
                        type: 'plan',
                        commands: [{ type: 'DO', action: AI.RateLimitedActionName, entities: {} } as PredictedDoCommand]
                    };
                }
                break;
            }
        }
        return undefined;
    }

    public async reviewPlan(context: TurnContext, state: TState, plan: Plan): Promise<Plan> {
        switch (this._options.moderate) {
            case 'output':
            case 'both':
                for (let i = 0; i < plan.commands.length; i++) {
                    const cmd = plan.commands[i];
                    if (cmd.type == 'SAY') {
                        const output = (cmd as PredictedSayCommand).response;
                        const result = await this.createModeration(output, this._options.model);
                        if (result) {
                            if (result.flagged) {
                                // Output flagged
                                return {
                                    type: 'plan',
                                    commands: [
                                        {
                                            type: 'DO',
                                            action: AI.FlaggedOutputActionName,
                                            entities: result
                                        } as PredictedDoCommand
                                    ]
                                };
                            }
                        } else {
                            // Rate limited
                            return {
                                type: 'plan',
                                commands: [
                                    { type: 'DO', action: AI.RateLimitedActionName, entities: {} } as PredictedDoCommand
                                ]
                            };
                        }
                    }
                }
                break;
        }

        return plan;
    }

    public get options(): OpenAIModeratorOptions {
        return this._options;
    }

    protected createClient(options: OpenAIModeratorOptions): OpenAIClient {
        return new OpenAIClient({
            apiKey: options.apiKey,
            organization: options.organization,
            endpoint: options.endpoint
        });
    }

    private async createModeration(
        input: string,
        model?: string
    ): Promise<CreateModerationResponseResultsInner | undefined> {
        const response = await this._client.createModeration({ input, model });
        if (response.data?.results && Array.isArray(response.data.results) && response.data.results.length > 0) {
            return response.data.results[0];
        } else {
            return undefined;
        }
    }
}
