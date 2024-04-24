/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Plan, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { TurnState } from '../TurnState';
import { TurnContext } from 'botbuilder';
import {
    CreateModerationResponseResultsInner,
    AzureOpenAIClient,
    AzureOpenAIModeratorCategory,
    CreateContentSafetyResponse,
    OpenAIClientResponse,
    ModerationResponse,
    CreateContentSafetyRequest,
    ContentSafetyHarmCategory,
    ContentSafetyOptions,
    ModerationSeverity
} from '../internals';
import { AI } from '../AI';
import { OpenAIModerator, OpenAIModeratorOptions } from './OpenAIModerator';

// Export the moderation severity
export { ModerationSeverity } from '../internals';

/**
 * Options for the OpenAI based moderator.
 */
export interface AzureOpenAIModeratorOptions extends OpenAIModeratorOptions {
    /**
     * Azure OpenAI Content Safety Categories.
     * Each category is provided with a severity level threshold from 0 to 6.
     * If the severity level of a category is greater than or equal to the threshold, the category is flagged.
     */
    categories?: ContentSafetyHarmCategory[];

    /**
     * Text blocklist Name. Only support following characters: 0-9 A-Z a-z - . _ ~. You could attach multiple lists name here.
     */
    blocklistNames?: string[];

    /**
     * When set to true, further analyses of harmful content will not be performed in cases where blocklists are hit.
     * When set to false, all analyses of harmful content will be performed, whether or not blocklists are hit.
     * Default value is false.
     */
    breakByBlocklists?: boolean;
}

const defaultHarmCategories: AzureOpenAIModeratorCategory[] = ['Hate', 'Sexual', 'SelfHarm', 'Violence'];

/**
 * An Azure OpenAI moderator that uses OpenAI's moderation API to review prompts and plans for safety.
 * @remarks
 * This moderation can be configured to review the input from the user, output from the model, or both.
 * @template TState Optional. Type of the applications turn state.
 */
export class AzureContentSafetyModerator<TState extends TurnState = TurnState> extends OpenAIModerator<TState> {
    private readonly _contentSafetyOptions: ContentSafetyOptions;
    private readonly _azureContentSafetyClient: AzureOpenAIClient;
    private readonly _azureContentSafetyCategories: Record<string, ContentSafetyHarmCategory> = {};

    /**
     * Creates a new instance of the OpenAI based moderator.
     * @param {AzureOpenAIModeratorOptions} options Configuration options for the moderator.
     */
    public constructor(options: AzureOpenAIModeratorOptions) {
        // Create the moderator options
        const moderatorOptions: OpenAIModeratorOptions = {
            apiKey: options.apiKey,
            moderate: options.moderate ?? 'both',
            endpoint: options.endpoint,
            apiVersion: options.apiVersion,
            organization: options.organization,
            model: options.model
        };
        super(moderatorOptions);

        // Create the Azure OpenAI Content Safety client
        this._azureContentSafetyClient = this.createClient(moderatorOptions);

        // Construct the content safety categories
        let categories: AzureOpenAIModeratorCategory[] = [];
        if (options.categories) {
            options.categories.forEach((category) => {
                categories.push(category.category);
                this._azureContentSafetyCategories[category.category] = category;
            });
        } else {
            categories = Object.assign([], defaultHarmCategories);
            this._azureContentSafetyCategories.Hate = {
                category: 'Hate',
                severity: 6
            };
            this._azureContentSafetyCategories.Sexual = {
                category: 'Sexual',
                severity: 6
            };
            this._azureContentSafetyCategories.SelfHarm = {
                category: 'SelfHarm',
                severity: 6
            };
            this._azureContentSafetyCategories.Violence = {
                category: 'Violence',
                severity: 6
            };
        }
        // Create the content safety request
        this._contentSafetyOptions = {
            categories: categories ?? defaultHarmCategories,
            blocklistNames: options.blocklistNames ?? [],
            breakByBlocklists: options.breakByBlocklists ?? false
        };
    }

    /**
     * Creates a new instance of the Azure OpenAI client.
     * @protected
     * @param {OpenAIModeratorOptions} options The options for the moderator.
     * @returns {AzureOpenAIClient} The Azure OpenAI client.
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
     * @param {string} input The input to moderate.
     * @returns {Promise<CreateModerationResponseResultsInner | undefined>} The moderation results.
     * This method is called by the moderator to moderate the input.
     * @template TState Optional. Type of the applications turn state.
     */
    protected async createModeration(input: string): Promise<CreateModerationResponseResultsInner | undefined> {
        const response = (await this._azureContentSafetyClient.createModeration({
            text: input,
            ...this._contentSafetyOptions
        } as CreateContentSafetyRequest)) as OpenAIClientResponse<ModerationResponse>;
        const data = response.data as CreateContentSafetyResponse;
        if (!data) {
            return undefined;
        }
        // Check if the input is safe for each category
        const hateResult: boolean =
            data.hateResult?.severity > 0 &&
            data.hateResult.severity <= this._azureContentSafetyCategories.Hate.severity;
        const selfHarmResult: boolean =
            data.selfHarmResult?.severity > 0 &&
            data.selfHarmResult.severity <= this._azureContentSafetyCategories.SelfHarm.severity;
        const sexualResult: boolean =
            data.sexualResult?.severity > 0 &&
            data.sexualResult.severity <= this._azureContentSafetyCategories.Sexual.severity;
        const violenceResult: boolean =
            data.violenceResult?.severity > 0 &&
            data.violenceResult.severity <= this._azureContentSafetyCategories.Violence.severity;

        // Create the moderation results
        const result: CreateModerationResponseResultsInner = {
            flagged: hateResult || selfHarmResult || sexualResult || violenceResult,
            categories: {
                hate: hateResult,
                'hate/threatening': hateResult,
                'self-harm': selfHarmResult,
                sexual: sexualResult,
                'sexual/minors': sexualResult,
                violence: violenceResult,
                'violence/graphic': violenceResult
            },
            category_scores: {
                // Normalize the scores to be between 0 and 1
                hate: (data.hateResult?.severity ?? 0) / ModerationSeverity.High,
                'hate/threatening': (data.hateResult?.severity ?? 0) / ModerationSeverity.High,
                'self-harm': (data.selfHarmResult?.severity ?? 0) / ModerationSeverity.High,
                sexual: (data.sexualResult?.severity ?? 0) / ModerationSeverity.High,
                'sexual/minors': (data.sexualResult?.severity ?? 0) / ModerationSeverity.High,
                violence: (data.violenceResult?.severity ?? 0) / ModerationSeverity.High,
                'violence/graphic': (data.violenceResult?.severity ?? 0) / ModerationSeverity.High
            }
        };
        return result;
    }

    /**
     * Reviews an incoming prompt for safety violations.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @returns {Promise<Plan | undefined>} An undefined value to approve the prompt or a new plan to redirect to if not approved.
     */
    public override async reviewInput(context: TurnContext, state: TState): Promise<Plan | undefined> {
        switch (this.options.moderate) {
            case 'input':
            case 'both': {
                const input = state.temp.input ?? context.activity.text;
                const result = await this.createModeration(input);
                if (result) {
                    if (result.flagged) {
                        // Input flagged
                        // console.info(`ReviewPrompt: Azure Content Safety Result: ${JSON.stringify(result)}`);
                        return {
                            type: 'plan',
                            commands: [
                                {
                                    type: 'DO',
                                    action: AI.FlaggedInputActionName,
                                    parameters: result
                                } as PredictedDoCommand
                            ]
                        };
                    }
                } else {
                    // Rate limited
                    return {
                        type: 'plan',
                        commands: [{ type: 'DO', action: AI.HttpErrorActionName, parameters: {} } as PredictedDoCommand]
                    };
                }
                break;
            }
        }
        return undefined;
    }

    /**
     * Reviews the SAY commands generated by the planner for safety violations.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {Plan} plan - Plan generated by the planner.
     * @returns {Promise<Plan>} The plan to execute. Either the current plan passed in for review or a new plan.
     */
    public async reviewOutput(context: TurnContext, state: TState, plan: Plan): Promise<Plan> {
        switch (this.options.moderate) {
            case 'output':
            case 'both':
                for (let i = 0; i < plan.commands.length; i++) {
                    const cmd = plan.commands[i];
                    if (cmd.type == 'SAY') {
                        const predictedSayCommand = cmd as PredictedSayCommand;
                        const output = predictedSayCommand.response;
                        const result = await this.createModeration(output.content || '');
                        if (result) {
                            if (result.flagged) {
                                // Output flagged
                                // console.info(`ReviewPlan: Azure Content Safety Result: ${JSON.stringify(result)}`);
                                return {
                                    type: 'plan',
                                    commands: [
                                        {
                                            type: 'DO',
                                            action: AI.FlaggedOutputActionName,
                                            parameters: result
                                        } as PredictedDoCommand
                                    ]
                                };
                            }
                        } else {
                            // Rate limited
                            return {
                                type: 'plan',
                                commands: [
                                    { type: 'DO', action: AI.HttpErrorActionName, parameters: {} } as PredictedDoCommand
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
