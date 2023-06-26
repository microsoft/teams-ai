// TODO: Remove these lines once the linting issues are resolved:
/* eslint-disable jsdoc/require-returns */
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
import {
    CreateModerationResponseResultsInner,
    AzureOpenAIClient,
    AzureOpenAIModeratorCategory,
    CreateContentSafetyResponse,
    OpenAIClientResponse,
    ModerationResponse
} from './OpenAIClients';
import { PromptTemplate } from './Prompts';
import { ConfiguredAIOptions, AI } from './AI';
import { OpenAIModerator, OpenAIModeratorOptions } from './OpenAIModerator';

/**
 * Options for the OpenAI based moderator.
 */
export interface AzureOpenAIModeratorOptions extends OpenAIModeratorOptions {
    /**
     * Optional: Azure OpenAI Content Safety Categories
     * Allowed values: "Hate", "Sexual", "SelfHarm", "Violence"
     */
    categories?: AzureOpenAIModeratorCategory[];
}

/**
 * An Azure OpenAI moderator that uses OpenAI's moderation API to review prompts and plans for safety.
 *
 * @remarks
 * This moderation can be configured to review the input from the user, output from the model, or both.
 * @template TState Optional. Type of the applications turn state.
 */
export class AzureOpenAIModerator<TState extends TurnState = DefaultTurnState> extends OpenAIModerator<TState> {
    private _harmCategories: AzureOpenAIModeratorCategory[];
    private readonly _azureContentSafetyClient: AzureOpenAIClient;

    /**
     * Creates a new instance of the OpenAI based moderator.
     *
     * @param options Configuration options for the moderator.
     */
    public constructor(options: AzureOpenAIModeratorOptions) {
        // Create the moderator options
        const moderatorOptions: AzureOpenAIModeratorOptions = {
            apiKey: options.apiKey,
            moderate: options.moderate ?? 'both',
            categories: options.categories ?? ['Hate', 'Sexual', 'SelfHarm', 'Violence'],
            endpoint: options.endpoint,
            apiVersion: options.apiVersion
        };
        super(moderatorOptions);

        this._azureContentSafetyClient = this.createClient(moderatorOptions);
        this._harmCategories = options.categories ?? [];
    }

    /**
     * Creates a new instance of the Azure OpenAI client.
     *
     * @protected
     * @param options The options for the moderator.
     */
    protected override createClient(options: OpenAIModeratorOptions): AzureOpenAIClient {
        return new AzureOpenAIClient({
            apiKey: options.apiKey,
            endpoint: options.endpoint!,
            apiVersion: options.apiVersion ?? '2023-04-30-preview',
            headerKey: 'Ocp-Apim-Subscription-Key'
        });
    }

    /**
     * @protected
     * @param input The input to moderate.
     * @returns The moderation results.
     * @remarks
     * This method is called by the moderator to moderate the input.
     * @template TState Optional. Type of the applications turn state.
     */
    protected async createModeration(input: string): Promise<CreateModerationResponseResultsInner | undefined> {
        const response = (await this._azureContentSafetyClient.createModeration({
            text: input,
            categories: this._harmCategories
        })) as OpenAIClientResponse<ModerationResponse>;
        const data = response.data as CreateContentSafetyResponse;
        if (!data) {
            return undefined;
        }
        const result: CreateModerationResponseResultsInner = {
            flagged:
                data.hateResult?.severity > 0 ||
                data.selfHarmResult?.severity > 0 ||
                data.sexualResult?.severity > 0 ||
                data.violenceResult?.severity > 0,
            categories: {
                hate: data.hateResult?.severity > 0,
                'hate/threatening': data.hateResult?.severity > 0,
                'self-harm': data.selfHarmResult?.severity > 0,
                sexual: data.sexualResult?.severity > 0,
                'sexual/minors': data.sexualResult?.severity > 0,
                violence: data.violenceResult?.severity > 0,
                'violence/graphic': data.violenceResult?.severity > 0
            },
            category_scores: {
                hate: data.hateResult?.severity ?? 0,
                'hate/threatening': data.hateResult?.severity ?? 0,
                'self-harm': data.selfHarmResult?.severity ?? 0,
                sexual: data.sexualResult?.severity ?? 0,
                'sexual/minors': data.sexualResult?.severity ?? 0,
                violence: data.violenceResult?.severity ?? 0,
                'violence/graphic': data.violenceResult?.severity ?? 0
            }
        };
        return result;
    }

    /**
     * Reviews an incoming utterance for safety violations.
     *
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param prompt Generated prompt to be reviewed.
     * @param options Current options for the AI system.
     * @returns An undefined value to approve the prompt or a new plan to redirect to if not approved.
     */
    public override async reviewPrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan | undefined> {
        switch (this.options.moderate) {
            case 'input':
            case 'both': {
                const input = state?.temp?.value.input ?? context.activity.text;
                const result = await this.createModeration(input);
                if (result) {
                    if (result.flagged) {
                        // Input flagged
                        console.info(`ReviewPrompt: Azure Content Safety Result: ${JSON.stringify(result)}`);
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
        return Promise.resolve(undefined);
    }

    /**
     * Reviews the SAY commands generated by the planner for safety violations.
     *
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param plan Plan generated by the planner.
     * @returns The plan to execute. Either the current plan passed in for review or a new plan.
     */
    public async reviewPlan(context: TurnContext, state: TState, plan: Plan): Promise<Plan> {
        switch (this.options.moderate) {
            case 'output':
            case 'both':
                for (let i = 0; i < plan.commands.length; i++) {
                    const cmd = plan.commands[i];
                    if (cmd.type == 'SAY') {
                        const predictedSayCommand = cmd as PredictedSayCommand;
                        const output = predictedSayCommand.response;
                        const result = await this.createModeration(output);
                        if (result) {
                            if (result.flagged) {
                                // Output flagged
                                console.info(`ReviewPlan: Azure Content Safety Result: ${JSON.stringify(result)}`);
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
}
