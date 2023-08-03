/**
 * @module teams-ai
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

/**
 * A function that can be used to select a prompt to use for the current turn.
 * @template TState Type of the turn state.
 * @param context The current turn context.
 * @param state The current turn state.
 * @returns A string or prompt template to use for the current turn.
 */
export type PromptSelector<TState extends TurnState> = (
    context: TurnContext,
    state: TState
) => Promise<string | PromptTemplate>;

/**
 * Entities argument passed to the action handler for AI.DoCommandActionName.
 * @template TState Type of the turn state.
 */
export interface PredictedDoCommandAndHandler<TState> extends PredictedDoCommand {
    /**
     * The handler that should be called to execute the command.
     * @param context Current turn context.
     * @param state Current turn state.
     * @param entities Entities predicted by the model.
     * @param action Name of the command being executed.
     * @returns Whether the AI system should continue executing the plan.
     */
    handler: (context: TurnContext, state: TState, entities?: Record<string, any>, action?: string) => Promise<boolean>;
}

/**
 * Options for configuring the AI system.
 * @template TState Type of the turn state.
 */
export interface AIOptions<TState extends TurnState> {
    /**
     * The planner to use for generating plans.
     */
    planner: Planner<TState>;

    /**
     * The prompt manager to use for generating prompts.
     */
    promptManager: PromptManager<TState>;

    /**
     * Optional. The moderator to use for moderating input passed to the model and the output
     * returned by the model.
     */
    moderator?: Moderator<TState>;

    /**
     * Optional. The prompt to use for the current turn.
     * @summary
     * This allows for the use of the AI system in a free standing mode. An exception will be
     * thrown if the AI system is routed to by the Application object and a prompt has not been
     * configured.
     */
    prompt?: string | PromptTemplate | PromptSelector<TState>;

    /**
     * Optional. The history options to use for the AI system.
     * @summary
     * Defaults to tracking history with a maximum of 3 turns and 1000 tokens per turn.
     */
    history?: Partial<AIHistoryOptions>;
}

/**
 * Options for configuring the AI systems history options.
 */
export interface AIHistoryOptions {
    /**
     * Whether the AI system should track conversation history.
     * @summary
     * Defaults to true.
     */
    trackHistory: boolean;

    /**
     * The maximum number of turns to remember.
     * @summary
     * Defaults to 3.
     */
    maxTurns: number;

    /**
     * The maximum number of tokens worth of history to add to the prompt.
     * @summary
     * Defaults to 1000.
     */
    maxTokens: number;

    /**
     * The line separator to use when concatenating history.
     * @summary
     * Defaults to '\n'.
     */
    lineSeparator: string;

    /**
     * The prefix to use for user history.
     * @summary
     * Defaults to 'User:'.
     */
    userPrefix: string;

    /**
     * The prefix to use for assistant history.
     * @summary
     * Defaults to 'Assistant:'.
     */
    assistantPrefix: string;

    /**
     * Whether the conversation history should include the plan object returned by the model or
     * just the text of any SAY commands.
     * @summary
     * Defaults to 'planObject'.
     */
    assistantHistoryType: 'text' | 'planObject';
}

/**
 * The configured options for the AI system after all defaults have been applied.
 * @template TState Type of the turn state.
 */
export interface ConfiguredAIOptions<TState extends TurnState> {
    /**
     * The planner being used for generating plans.
     */
    planner: Planner<TState>;

    /**
     * The prompt manager being used for generating prompts.
     */
    promptManager: PromptManager<TState>;

    /**
     * The moderator being used for moderating input passed to the model and the output
     */
    moderator: Moderator<TState>;

    /**
     * Optional prompt to use by default.
     */
    prompt?: string | PromptTemplate | ((Context: TurnContext, state: TState) => Promise<string | PromptTemplate>);

    /**
     * The history options being used by the AI system.
     */
    history: AIHistoryOptions;
}

/**
 * AI System.
 * @summary
 * The AI system is responsible for generating plans, moderating input and output, and
 * generating prompts. It can be used free standing or routed to by the Application object.
 * @template TState Optional. Type of the turn state.
 */
export class AI<TState extends TurnState = DefaultTurnState> {
    private readonly _actions: Map<string, ActionEntry<TState>> = new Map();
    private readonly _options: ConfiguredAIOptions<TState>;

    /**
     * An action that will be called anytime an unknown action is predicted by the planner.
     * @summary
     * The default behavior is to simply log an error to the console. The plan is allowed to
     * continue execution by default.
     */
    public static readonly UnknownActionName = '___UnknownAction___';

    /**
     * An action that will be called anytime an input is flagged by the moderator.
     * @summary
     * The default behavior is to simply log an error to the console. Override to send a custom
     * message to the user.
     */
    public static readonly FlaggedInputActionName = '___FlaggedInput___';

    /**
     * An action that will be called anytime an output is flagged by the moderator.
     * @summary
     * The default behavior is to simply log an error to the console. Override to send a custom
     * message to the user.
     */
    public static readonly FlaggedOutputActionName = '___FlaggedOutput___';

    /**
     * An action that will be called anytime the planner is rate limited.
     */
    public static readonly RateLimitedActionName = '___RateLimited___';

    /**
     * An action that will be called after the plan has been predicted by the planner and it has
     * passed moderation.
     * @summary
     * Overriding this action lets you customize the decision to execute a plan separately from the
     * moderator. The default behavior is to proceed with the plans execution only with a plan
     * contains one or more commands. Returning false from this action can be used to prevent the plan
     * from being executed.
     */
    public static readonly PlanReadyActionName = '___PlanReady___';

    /**
     * An action that is called to DO an action.
     * @summary
     * The action system is used to do other actions. Overriding this action lets you customize the
     * execution of an individual action. You can use it to log actions being used or to prevent
     * certain actions from being executed based on policy.
     *
     * The default behavior is to simply execute the action handler passed in so you will need to
     * perform that logic yourself should you override this action.
     */
    public static readonly DoCommandActionName = '___DO___';

    /**
     * An action that is called to SAY something.
     * @summary
     * Overriding this action lets you customize the execution of the SAY command. You can use it
     * to log the output being generated or to add support for sending certain types of output as
     * message attachments.
     *
     * The default behavior attempts to look for an Adaptive Card in the output and if found sends
     * it as an attachment. If no Adaptive Card is found then the output is sent as a plain text
     * message.
     *
     * If you override this action and want to automatically send Adaptive Cards as attachments you
     * will need to handle that yourself.
     */
    public static readonly SayCommandActionName = '___SAY___';

    /**
     * Creates a new AI system.
     * @param {ConfiguredAIOptions} options The options used to configure the AI system.
     */
    public constructor(options: AIOptions<TState>) {
        this._options = Object.assign({}, options) as ConfiguredAIOptions<TState>;

        // Create moderator if needed
        if (!this._options.moderator) {
            this._options.moderator = new DefaultModerator<TState>();
        }

        // Initialize history options
        this._options.history = Object.assign(
            {
                trackHistory: true,
                maxTurns: 3,
                maxTokens: 1000,
                lineSeparator: '\n',
                userPrefix: 'User:',
                assistantPrefix: 'Assistant:',
                assistantHistoryType: 'planObject'
            } as AIHistoryOptions,
            this._options.history
        );

        // Register default UnknownAction handler
        this.action(
            AI.UnknownActionName,
            (context, state, data, action?) => {
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

    /**
     * Returns the moderator being used by the AI system.
     * @summary
     * The default moderator simply allows all messages and plans through without intercepting them.
     * @returns {Moderator} The AI's moderator
     */
    public get moderator(): Moderator<TState> {
        return this._options.moderator;
    }

    /**
     * @returns {ConfiguredAIOptions} Returns the configured options for the AI system.
     */
    public get options(): ConfiguredAIOptions<TState> {
        return this._options;
    }

    /**
     * @returns {Planner} Returns the planner being used by the AI system.
     */
    public get planner(): Planner<TState> {
        return this._options.planner;
    }

    /**
     * @returns {PromptManager} Returns the prompt manager being used by the AI system.
     */
    public get prompts(): PromptManager<TState> {
        return this._options.promptManager;
    }

    /**
     * Registers a handler for a named action.
     * @summary
     * The AI systems planner returns plans that are made up of a series of commands or actions
     * that should be performed. Registering a handler lets you provide code that should be run in
     * response to one of the predicted actions.
     *
     * Plans support a DO command which specifies the name of an action to call and an optional
     * set of entities that should be passed to the action. The internal plan executor will call
     * the registered handler for the action passing in the current context, state, and entities.
     *
     * Additionally, the AI system itself uses actions to handle things like unknown actions,
     * flagged input, and flagged output. You can override these actions by registering your own
     * handler for them. The names of the built-in actions are available as static properties on
     * the AI class.
     * @template TEntities (Optional) The type of entities that the action handler expects.
     * @param {string | string[]} name Unique name of the action.
     * @param {function(context, state, entities, action): Promise<boolean>} handler Function to call when the action is triggered.
     * @param {boolean} allowOverrides Optional. If true, this handler is allowed to be overridden. Defaults to false.
     * @returns {AI} The AI system instance for chaining purposes.
     */
    public action<TEntities extends Record<string, any> | undefined>(
        name: string | string[],
        handler: (context: TurnContext, state: TState, entities: TEntities, action?: string) => Promise<boolean>,
        allowOverrides = false
    ): this {
        (Array.isArray(name) ? name : [name]).forEach((n) => {
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

    /**
     * Chains into another prompt and executes the plan that is returned.
     * @summary
     * This method is used to chain into another prompt. It will call the prompt manager to
     * get the plan for the prompt and then execute the plan. The return value indicates whether
     * that plan was completely executed or not, and can be used to make decisions about whether the
     * outer plan should continue executing.
     * @param {TurnContext} context Current turn context.
     * @param {TState} state Current turn state.
     * @param {string | PromptTemplate} prompt Optional. Prompt name or prompt template to use. If omitted, the AI systems default prompt will be used.
     * @param {Partial<AIOptions<TState>>} options Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.
     * @returns {boolean} True if the plan was completely executed, otherwise false.
     */
    public async chain(
        context: TurnContext,
        state: TState,
        prompt?: string | PromptTemplate,
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
        const temp = (state as any as DefaultTurnState)?.temp?.value ?? ({} as DefaultTempState);
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
        let continueChain = await this._actions.get(AI.PlanReadyActionName)!.handler(context, state, plan, '');
        if (continueChain) {
            // Update conversation history
            if (opts.history.trackHistory) {
                ConversationHistory.addLine(
                    state,
                    `${opts.history.userPrefix.trim()} ${temp.input.trim()}`,
                    opts.history.maxTurns * 2
                );
                switch (opts.history.assistantHistoryType) {
                    case 'text': {
                        // Extract only the things the assistant has said
                        const text = plan.commands
                            .filter((v) => v.type == 'SAY')
                            .map((v) => (v as PredictedSayCommand).response)
                            .join('\n');
                        ConversationHistory.addLine(
                            state,
                            `${opts.history.assistantPrefix.trim()} ${text}`,
                            opts.history.maxTurns * 2
                        );
                        break;
                    }
                    case 'planObject':
                    default:
                        // Embed the plan object to re-enforce the model
                        // - TODO: add support for XML as well
                        ConversationHistory.addLine(
                            state,
                            `${opts.history.assistantPrefix.trim()} ${JSON.stringify(plan)}`,
                            opts.history.maxTurns * 2
                        );
                        break;
                }
            }

            // Run predicted commands
            for (let i = 0; i < plan.commands.length && continueChain; i++) {
                // TODO
                // eslint-disable-next-line security/detect-object-injection
                const cmd = plan.commands[i];
                switch (cmd.type) {
                    case 'DO': {
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
                    }
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

    /**
     * A helper method to complete a prompt using the configured prompt manager.
     * @param {TurnContext} context Current turn context.
     * @param {TState} state Current turn state.
     * @param {string | PromptTemplate} prompt Prompt name or prompt template to use.
     * @param {Partial<AIOptions<TState>>} options Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.
     * @returns {Promise<string | undefined>} The result of the prompt. If the prompt was not completed (typically due to rate limiting), the return value will be undefined.
     */
    public async completePrompt(
        context: TurnContext,
        state: TState,
        prompt: string | PromptTemplate,
        options?: Partial<AIOptions<TState>>
    ): Promise<string | undefined> {
        // Configure options
        const opts = this.configureOptions(options);

        // Render the prompt
        const renderedPrompt = await opts.promptManager.renderPrompt(context, state, prompt);

        // Complete the prompt
        return await opts.planner.completePrompt(context, state, renderedPrompt, opts);
    }

    /**
     * Creates a semantic function that can be registered with the apps prompt manager.
     * @param {string} name The name of the semantic function.
     * @param {PromptTemplate} template The prompt template to use.
     * @param {Partial<AIOptions<TState>>} options Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.
     * @summary
     * Semantic functions are functions that make model calls and return their results as template
     * parameters to other prompts. For example, you could define a semantic function called
     * 'translator' that first translates the user's input to English before calling your main prompt:
     *
     * ```JavaScript
     * app.ai.prompts.addFunction('translator', app.ai.createSemanticFunction('translator-prompt'));
     * ```
     *
     * You would then create a prompt called "translator-prompt" that does the translation and then in
     * your main prompt you can call it using the template expression `{{translator}}`.
     * @returns {Promise<any>} A promise that resolves to the result of the semantic function.
     */
    public createSemanticFunction(
        name: string,
        template?: PromptTemplate,
        options?: Partial<AIOptions<TState>>
    ): (context: TurnContext, state: TState) => Promise<any> {
        // Cache prompt template if being dynamically assigned
        if (template) {
            this._options.promptManager.addPromptTemplate(name, template);
        }

        return (context: TurnContext, state: TState) => this.completePrompt(context, state, name, options);
    }

    /**
     * Manually executes a named action.
     * @template TEntities Optional. Type of entities expected to be passed to the action.
     * @param {TurnContext} context Current turn context.
     * @param {TState} state Current turn state.
     * @param {string} action Name of the action to execute.
     * @param {TEntities} entities Optional. Entities to pass to the action.
     * @returns {Promise<boolean>} True if the action thinks other actions should be executed.
     */
    public async doAction<TEntities = Record<string, any>>(
        context: TurnContext,
        state: TState,
        action: string,
        entities?: TEntities
    ): Promise<boolean> {
        if (!this._actions.has(action)) {
            throw new Error(`Can't find an action named '${action}'.`);
        }

        const handler = this._actions.get(action)!.handler;
        return await handler(context, state, entities, action);
    }

    /**
     * Configures the AI options.
     * @param {Partial<AIOptions<TState>>} options Optional. Override options for the AI. If omitted, the AI systems configured options will be used.
     * @returns {ConfiguredAIOptions<TState>} The configured AI options.
     * @private
     */
    private configureOptions(options?: Partial<AIOptions<TState>>): ConfiguredAIOptions<TState> {
        /**
         * The configured AI options.
         * @type {ConfiguredAIOptions<TState>}
         */
        let configuredOptions: ConfiguredAIOptions<TState>;
        if (options) {
            configuredOptions = Object.assign({}, this._options, options) as ConfiguredAIOptions<TState>;
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

/**
 * @private
 */
interface ActionEntry<TState> {
    handler: (context: TurnContext, state: TState, entities?: any, action?: string) => Promise<boolean>;
    allowOverrides: boolean;
}
