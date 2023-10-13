/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Channels, TurnContext } from 'botbuilder';
import { DefaultModerator } from './moderators';
import { Moderator } from './moderators/Moderator';
import { PredictedDoCommand, PredictedSayCommand, Planner, Plan } from './planners';
import { TurnState } from './TurnState';
import { Schema } from 'jsonschema';

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
     * Optional. The moderator to use for moderating input passed to the model and the output
     * returned by the model.
     */
    moderator?: Moderator<TState>;
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
     * The moderator being used for moderating input passed to the model and the output
     */
    moderator: Moderator<TState>;
}

/**
 * AI System.
 * @summary
 * The AI system is responsible for generating plans, moderating input and output, and
 * generating prompts. It can be used free standing or routed to by the Application object.
 * @template TState Optional. Type of the turn state.
 */
export class AI<TState extends TurnState = TurnState> {
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

        // Register default UnknownAction handler
        this.defaultAction(
            AI.UnknownActionName,
            (context, state, data, action?) => {
                console.error(`An AI action named "${action}" was predicted but no handler was registered.`);
                return Promise.resolve(true);
            }
        );

        // Register default FlaggedInputAction handler
        this.defaultAction(
            AI.FlaggedInputActionName,
            (context, state, data, action) => {
                console.error(
                    `The users input has been moderated but no handler was registered for 'AI.FlaggedInputActionName'.`
                );
                return Promise.resolve(true);
            }
        );

        // Register default FlaggedOutputAction handler
        this.defaultAction(
            AI.FlaggedOutputActionName,
            (context, state, data, action) => {
                console.error(
                    `The bots output has been moderated but no handler was registered for 'AI.FlaggedOutputActionName'.`
                );
                return Promise.resolve(true);
            }
        );

        // Register default RateLimitedActionName
        this.defaultAction(
            AI.RateLimitedActionName,
            (context, state, data, action) => {
                throw new Error(`An AI request failed because it was rate limited`);
            }
        );

        // Register default PlanReadyActionName
        this.defaultAction<Plan>(
            AI.PlanReadyActionName,
            async (context, state, plan) => {
                return Array.isArray(plan.commands) && plan.commands.length > 0;
            }
        );

        // Register default DoCommandActionName
        this.defaultAction<PredictedDoCommandAndHandler<TState>>(
            AI.DoCommandActionName,
            async (context, state, data, action) => {
                const { parameters: entities, handler } = data;
                return await handler(context, state, entities, action);
            }
        );

        // Register default SayCommandActionName
        this.defaultAction<PredictedSayCommand>(
            AI.SayCommandActionName,
            async (context, state, data, action) => {
                const response = data.response;
                if (context.activity.channelId == Channels.Msteams) {
                    await context.sendActivity(response.split('\n').join('<br>'));
                } else {
                    await context.sendActivity(response);
                }

                return true;
            }
        );
    }

    /**
     * Returns the moderator being used by the AI system.
     * @summary
     * The default moderator simply allows all messages and plans through without intercepting them.
     * @returns The AI's moderator
     */
    public get moderator(): Moderator<TState> {
        return this._options.moderator;
    }

    /**
     * @returns Returns the planner being used by the AI system.
     */
    public get planner(): Planner<TState> {
        return this._options.planner;
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
     * @template TEntities Optional. The type of entities that the action handler expects.
     * @param name Unique name of the action.
     * @param handler Function to call when the action is triggered.
     * @param schema Optional. Schema for the actions entities.
     * @returns The AI system instance for chaining purposes.
     */
    public action<TEntities extends Record<string, any> | undefined>(
        name: string | string[],
        handler: (context: TurnContext, state: TState, entities: TEntities, action?: string) => Promise<boolean>,
        schema?: Schema
    ): this {
        (Array.isArray(name) ? name : [name]).forEach((n) => {
            if (!this._actions.has(n)) {
                this._actions.set(n, { handler, schema, allowOverrides: false });
            } else {
                const entry = this._actions.get(n);
                if (entry!.allowOverrides) {
                    entry!.handler = handler;
                    entry!.allowOverrides = false;  // Only override once
                    if (schema) {
                        entry!.schema = schema;
                    }
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
     * Registers the default handler for a named action.
     * @summary
     * Default handlers can be replaced by calling the action() method with the same name.
     * @template TEntities Optional. The type of entities that the action handler expects.
     * @param name Unique name of the action.
     * @param handler Function to call when the action is triggered.
     * @param schema Optional. The schema for the actions entities.
     * @returns The AI system instance for chaining purposes.
     */
    public defaultAction<TEntities extends Record<string, any> | undefined>(
        name: string | string[],
        handler: (context: TurnContext, state: TState, entities: TEntities, action?: string) => Promise<boolean>,
        schema?: Schema
    ): this {
        (Array.isArray(name) ? name : [name]).forEach((n) => {
            this._actions.set(n, { handler, schema, allowOverrides: true });
        });

        return this;
    }

    /**
     * Manually executes a named action.
     * @template TEntities Optional. Type of entities expected to be passed to the action.
     * @param context Current turn context.
     * @param state Current turn state.
     * @param action Name of the action to execute.
     * @param entities Optional. Entities to pass to the action.
     * @returns True if the action thinks other actions should be executed.
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
     * Gets the schema for a given action.
     * @param action Name of the action to get the schema for.
     * @returns The schema for the action or undefined if the action doesn't have a schema.
     */
    public getActionSchema(action: string): Schema | undefined {
        if (!this._actions.has(action)) {
            throw new Error(`Can't find an action named '${action}'.`);
        }

        return this._actions.get(action)!.schema;
    }

    /**
     * Checks to see if the AI system has a handler for a given action.
     * @param action Name of the action to check.
     * @returns True if the AI system has a handler for the given action.
     */
    public hasAction(action: string): boolean {
        return this._actions.has(action);
    }


    /**
     * Calls the configured planner to generate a plan and executes the plan that is returned.
     * @summary
     * The moderator is called to review the input and output of the plan. If the moderator flags
     * the input or output then the appropriate action is called. If the moderator allows the input
     * and output then the plan is executed.
     * @param context Current turn context.
     * @param state Current turn state.
     * @returns True if the plan was completely executed, otherwise false.
     */
    public async run(
        context: TurnContext,
        state: TState
    ): Promise<boolean> {
        // Populate {{$temp.input}}
        if (typeof state.temp.input != 'string') {
            // Use the received activity text
            state.temp.input = context.activity.text;
        }

        // Generate plan
        let plan = await this._options.moderator.reviewInput(context, state);
        if (!plan) {
            plan = await this._options.planner.generatePlan(context, state, this);
            plan = await this._options.moderator.reviewOutput(context, state, plan);
        }

        // Process generated plan
        let continuePlan = await this._actions.get(AI.PlanReadyActionName)!.handler(context, state, plan, '');
        if (continuePlan) {
            // Run predicted commands
            for (let i = 0; i < plan.commands.length && continuePlan; i++) {
                // eslint-disable-next-line security/detect-object-injection
                const cmd = plan.commands[i];
                switch (cmd.type) {
                    case 'DO': {
                        const { action } = cmd as PredictedDoCommand;
                        if (this._actions.has(action)) {
                            // Call action handler
                            const handler = this._actions.get(action)!.handler;
                            continuePlan = await this._actions
                                .get(AI.DoCommandActionName)!
                                .handler(context, state, { handler, ...(cmd as PredictedDoCommand) }, action);
                        } else {
                            // Redirect to UnknownAction handler
                            continuePlan = await this._actions
                                .get(AI.UnknownActionName)!
                                .handler(context, state, plan, action);
                        }
                        break;
                    }
                    case 'SAY':
                        continuePlan = await this._actions
                            .get(AI.SayCommandActionName)!
                            .handler(context, state, cmd, AI.SayCommandActionName);
                        break;
                    default:
                        throw new Error(`AI.run(): unknown command of '${cmd.type}' predicted.`);
                }
            }
        }

        return continuePlan;
    }
}

/**
 * @private
 */
interface ActionEntry<TState> {
    handler: (context: TurnContext, state: TState, entities?: any, action?: string) => Promise<boolean>;
    schema?: Schema;
    allowOverrides: boolean;
}
