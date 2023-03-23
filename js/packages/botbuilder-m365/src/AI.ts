/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CardFactory, Channels, MessageFactory, TurnContext } from 'botbuilder';
import { ConversationHistory } from './ConversationHistory';
import { DefaultModerator } from './DefaultModerator';
import { DefaultTempState, DefaultTurnState } from './DefaultTurnStateManager';
import { Moderator } from './Moderator';
import { PredictedDoCommand, PredictedSayCommand, Planner, Plan } from './Planner';
import { PromptManager, PromptTemplate } from './Prompts';
import { ResponseParser } from './ResponseParser';
import { TurnState } from './TurnState';

export type PromptSelector<TState extends TurnState> = (Context: TurnContext, state: TState) => Promise<string|PromptTemplate>;

export interface PredictedDoCommandAndHandler<TState> extends PredictedDoCommand {
    handler: (context: TurnContext, state: TState, data?: Record<string, any>, action?: string) => Promise<boolean>;
}

export interface AIOptions<TState extends TurnState> {
    planner: Planner<TState>;
    promptManager: PromptManager<TState>;
    moderator?: Moderator<TState>;
    prompt?: string|PromptTemplate|PromptSelector<TState>;
    history?: Partial<AIHistoryOptions>;
}

export interface AIHistoryOptions {
    trackHistory: boolean;
    maxTurns: number;
    maxTokens: number;
    lineSeparator: string;
    userPrefix: string;
    assistantPrefix: string;
    assistantHistoryType: 'text' | 'planObject';
}

export interface ConfiguredAIOptions<TState extends TurnState> {
    planner: Planner<TState>;
    promptManager: PromptManager<TState>;
    moderator: Moderator<TState>;
    prompt?: string|PromptTemplate|((Context: TurnContext, state: TState) => Promise<string|PromptTemplate>);
    history: AIHistoryOptions;
}

export class AI<TState extends TurnState = DefaultTurnState> {
    private readonly _actions: Map<string, ActionEntry<TState>> = new Map();
    private readonly _options: ConfiguredAIOptions<TState>;

    public static readonly UnknownActionName = '___UnknownAction___';
    public static readonly FlaggedInputActionName = '___FlaggedInput___';
    public static readonly FlaggedOutputActionName = '___FlaggedOutput___';
    public static readonly RateLimitedActionName = '___RateLimited___';
    public static readonly PlanReadyActionName = '___PlanReady___';
    public static readonly DoCommandActionName = '___DO___';
    public static readonly SayCommandActionName = '___SAY___';

    public constructor(options: AIOptions<TState>) {
        this._options = Object.assign({}, options) as ConfiguredAIOptions<TState>;

        // Create moderator if needed
        if (!this._options.moderator) {
            this._options.moderator = new DefaultModerator<TState>();
        }

        // Initialize history options
        this._options.history = Object.assign({
            trackHistory: true,
            maxTurns: 3,
            maxTokens: 1000,
            lineSeparator: '\n',
            userPrefix: 'User:',
            assistantPrefix: 'Assistant:',
            assistantHistoryType: 'planObject'
        } as AIHistoryOptions, this._options.history);

        // Register default UnknownAction handler
        this.action(
            AI.UnknownActionName,
            (context, state, data, action) => {
                console.error(`An AI action named "${action}" was predicted but no handler was registered.`);
                return Promise.resolve(true);
            },
            true
        );

        // Register default FlaggedInputAction handler
        this.action(
            AI.FlaggedInputActionName,
            (context, state, data, action) => {
                console.error(
                    `The users input has been moderated but no handler was registered for 'AI.FlaggedInputActionName'.`
                );
                return Promise.resolve(true);
            },
            true
        );

        // Register default FlaggedOutputAction handler
        this.action(
            AI.FlaggedOutputActionName,
            (context, state, data, action) => {
                console.error(
                    `The bots output has been moderated but no handler was registered for 'AI.FlaggedOutputActionName'.`
                );
                return Promise.resolve(true);
            },
            true
        );

        // Register default RateLimitedActionName
        this.action(
            AI.RateLimitedActionName,
            (context, state, data, action) => {
                throw new Error(`An AI request failed because it was rate limited`);
            },
            true
        );

        // Register default PlanReadyActionName
        this.action<Plan>(
            AI.PlanReadyActionName,
            async (context, state, plan) => {
                return Array.isArray(plan.commands) && plan.commands.length > 0;
            },
            true
        );

        // Register default DoCommandActionName
        this.action<PredictedDoCommandAndHandler<TState>>(
            AI.DoCommandActionName,
            async (context, state, data, action) => {
                const { entities, handler } = data;
                return await handler(context, state, entities, action);
            },
            true
        );

        // Register default SayCommandActionName
        this.action<PredictedSayCommand>(
            AI.SayCommandActionName,
            async (context, state, data, action) => {
                const response = data.response;
                const card = ResponseParser.parseAdaptiveCard(response);
                if (card) {
                    const attachment = CardFactory.adaptiveCard(card);
                    const activity = MessageFactory.attachment(attachment);
                    await context.sendActivity(activity);
                } else if (context.activity.channelId == Channels.Msteams) {
                    await context.sendActivity(response.split('\n').join('<br>'));
                } else {
                    await context.sendActivity(response);
                }

                return true;
            },
            true
        );
    }

    public get moderator(): Moderator<TState> {
        return this._options.moderator;
    }

    public get options(): ConfiguredAIOptions<TState> {
        return this._options;
    }

    public get planner(): Planner<TState> {
        return this._options.planner;
    }

    public get prompts(): PromptManager<TState> {
        return this._options.promptManager;
    }

    /**
     * Registers a handler for a named action.
     *
     *
     * Actions can be triggered by a planner returning a DO command.
     *
     * @param name Unique name of the action.
     * @param handler Function to call when the action is triggered.
     * @param allowOverrides Optional. If true
     * @returns The application instance for chaining purposes.
     */
    public action<TEntities = Record<string, any>>(
        name: string | string[],
        handler: (context: TurnContext, state: TState, entities: TEntities, action: string) => Promise<boolean>,
        allowOverrides = false
    ): this {
        (Array.isArray(name) ? name : [name]).forEach(n => {
            if (!this._actions.has(n) || allowOverrides) {
                this._actions.set(n, { handler, allowOverrides });
            } else {
                const entry = this._actions.get(n);
                if (entry!.allowOverrides) {
                    entry!.handler = handler;
                } else {
                    throw new Error(
                        `The AI.action() method was called with a previously registered action named "${n}".`
                    );
                }
            }
        });

        return this;
    }

    public async chain(
        context: TurnContext,
        state: TState,
        prompt?: string|PromptTemplate,
        options?: Partial<AIOptions<TState>>
    ): Promise<boolean> {
        // Configure options
        const opts = this.configureOptions(options);

        // Select prompt
        if (!prompt) {
            if (opts.prompt == undefined) {
                throw new Error(`AI.chain() was called without a prompt and no default prompt was configured.`);
            } else if (typeof opts.prompt == 'function') {
                prompt = await opts.prompt(context, state);
            } else {
                prompt = opts.prompt;
            }
        }

        // Populate {{$temp.input}}
        const temp = (state as any as DefaultTurnState)?.temp?.value ?? {} as DefaultTempState;
        if (typeof temp.input != 'string') {
            // Use the received activity text
            temp.input = context.activity.text;
        }

        // Populate {{$temp.history}}
        if (typeof temp.history != 'string' && opts.history.trackHistory) {
            temp.history = ConversationHistory.toString(state, opts.history.maxTokens, opts.history.lineSeparator);
        }

        // Render the prompt
        const renderedPrompt = await opts.promptManager.renderPrompt(context, state, prompt);

        // Generate plan
        let plan = await opts.moderator.reviewPrompt(context, state, renderedPrompt, opts);
        if (!plan) {
            plan = await opts.planner.generatePlan(context, state, renderedPrompt, opts);
            plan = await opts.moderator.reviewPlan(context, state, plan);
        }

        // Process generated plan
        let continueChain = await this._actions
            .get(AI.PlanReadyActionName)!
            .handler(context, state, plan, '');
        if (continueChain) {
            // Update conversation history
            if (opts.history.trackHistory) {
                ConversationHistory.addLine(state, `${opts.history.userPrefix.trim()} ${temp.input.trim()}`, opts.history.maxTurns * 2);
                switch (opts.history.assistantHistoryType) {
                    case 'text':
                        // Extract only the things the assistant has said
                        const text = plan.commands.filter(v => v.type == 'SAY').map(v => (v as PredictedSayCommand).response).join('\n');
                        ConversationHistory.addLine(state, `${opts.history.assistantPrefix.trim()} ${text}`, opts.history.maxTurns * 2);
                        break;
                    case 'planObject':
                    default:
                        // Embed the plan object to re-enforce the model
                        // - TODO: add support for XML as well
                        ConversationHistory.addLine(state, `${opts.history.assistantPrefix.trim()} ${JSON.stringify(plan)}`, opts.history.maxTurns * 2);
                        break;
                }
            }

            // Run predicted commands
            for (let i = 0; i < plan.commands.length && continueChain; i++) {
                const cmd = plan.commands[i];
                switch (cmd.type) {
                    case 'DO':
                        const { action } = cmd as PredictedDoCommand;
                        if (this._actions.has(action)) {
                            // Call action handler
                            const handler = this._actions.get(action)!.handler;
                            continueChain = await this._actions
                                .get(AI.DoCommandActionName)!
                                .handler(context, state, { handler, ...(cmd as PredictedDoCommand) }, action);
                        } else {
                            // Redirect to UnknownAction handler
                            continueChain = await this._actions
                                .get(AI.UnknownActionName)!
                                .handler(context, state, plan, action);
                        }
                        break;
                    case 'SAY':
                        continueChain = await this._actions
                            .get(AI.SayCommandActionName)!
                            .handler(context, state, cmd, AI.SayCommandActionName);
                        break;
                    default:
                        throw new Error(`Application.run(): unknown command of '${cmd.type}' predicted.`);
                }
            }
        }

        return continueChain;
    }

    public async completePrompt(
        context: TurnContext,
        state: TState,
        prompt: string|PromptTemplate,
        options?: Partial<AIOptions<TState>>
    ): Promise<string|undefined> {
        // Configure options
        const opts = this.configureOptions(options);

        // Render the prompt
        const renderedPrompt = await opts.promptManager.renderPrompt(context, state, prompt);

        // Complete the prompt
        return await opts.planner.completePrompt(context, state, renderedPrompt, opts);
    }

    public createSemanticFunction(name: string, template?: PromptTemplate, options?: Partial<AIOptions<TState>>): (context: TurnContext, state: TState) => Promise<any> {
        // Cache prompt template if being dynamically assigned
        if (template) {
            this._options.promptManager.addPromptTemplate(name, template);
        }

        return (context: TurnContext, state: TState) => this.completePrompt(context, state, name, options);
    }

    public doAction<TData = Record<string, any>>(
        context: TurnContext,
        state: TState,
        action: string,
        data?: TData
    ): Promise<boolean> {
        if (!this._actions.has(action)) {
            throw new Error(`Can't find an action named '${action}'.`);
        }

        const handler = this._actions.get(action)!.handler;
        return handler(context, state, data, action);
    }

    private configureOptions(options?: Partial<AIOptions<TState>>): ConfiguredAIOptions<TState> {
        let configuredOptions: ConfiguredAIOptions<TState>;
        if (options) {
            configuredOptions = Object.assign({}, this._options,  options) as ConfiguredAIOptions<TState>;
            if (options.history) {
                // Just inherit any missing history settings
                options.history = Object.assign({}, this._options.history, options.history);
            } else {
                // Disable history tracking by default
                options.history = Object.assign({}, this._options.history, { trackHistory: false });
            }
        } else {
            configuredOptions = this._options;
        }

        return configuredOptions;
    }
}

interface ActionEntry<TState> {
    handler: (context: TurnContext, state: TState, data?: Record<string, any>, action?: string) => Promise<boolean>;
    allowOverrides: boolean;
}
