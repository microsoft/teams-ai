/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';

import { DefaultModerator } from './moderators';
import { Moderator } from './moderators/Moderator';
import { PredictedDoCommand, Planner, Plan } from './planners';
import { TurnState } from './TurnState';
import * as actions from './actions';

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

    /**
     * Optional. Maximum number of actions to execute in a single turn.
     * @remarks
     * The default value is 25.
     */
    max_actions?: number;

    /**
     * Optional. Maximum amount of time to spend executing a single turn in milliseconds.
     * @remarks
     * The default value is 300000 or 5 minutes.
     */
    max_time?: number;

    /**
     * Optional. If true, the AI system will allow the planner to loop.
     * @remarks
     * The default value is `true`.
     *
     * Looping is needed for augmentations like `functions` and `monologue` where the LLM needs to
     * see the result of the last action that was performed. The AI system will attempt to autodetect
     * if it needs to loop so you generally don't need to worry about this setting.
     *
     * If you're using an augmentation like `sequence` you can set this to `false` to guard against
     * any accidental looping.
     */
    allow_looping?: boolean;

    /**
     * Optional. If true, the AI system will enable the feedback loop in Teams that allows a user to give thumbs up or down to a response. Default is `false`.
     * NOTE: At this time, there is no activity handler support in the Teams AI Library to handle when a user gives feedback.
     */
    enable_feedback_loop?: boolean;
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

    /**
     * Maximum number of actions to execute in a single turn.
     */
    max_steps: number;

    /**
     * Maximum amount of time to spend executing a single turn in milliseconds.
     */
    max_time: number;

    /**
     * If true, the AI system will allow the planner to loop.
     */
    allow_looping: boolean;

    /**
     * If true, the AI system will enable the feedback loop in Teams that allows a user to give thumbs up or down to a response.
     */
    enable_feedback_loop: boolean;
}

/**
 * AI System.
 * @remarks
 * The AI system is responsible for generating plans, moderating input and output, and
 * generating prompts. It can be used free standing or routed to by the Application object.
 * @template TState Optional. Type of the turn state.
 */
export class AI<TState extends TurnState = TurnState> {
    private readonly _actions: Map<string, actions.ActionEntry<TState>> = new Map();
    private readonly _options: ConfiguredAIOptions<TState>;

    /**
     * A text string that can be returned from an action to stop the AI system from continuing
     * to execute the current plan.
     */
    public static readonly StopCommandName = actions.StopCommandName;

    /**
     * An action that will be called anytime an unknown action is predicted by the planner.
     * @remarks
     * The default behavior is to simply log an error to the console. The plan is allowed to
     * continue execution by default.
     */
    public static readonly UnknownActionName = '___UnknownAction___';

    /**
     * An action that will be called anytime an input is flagged by the moderator.
     * @remarks
     * The default behavior is to simply log an error to the console. Override to send a custom
     * message to the user.
     */
    public static readonly FlaggedInputActionName = '___FlaggedInput___';

    /**
     * An action that will be called anytime an output is flagged by the moderator.
     * @remarks
     * The default behavior is to simply log an error to the console. Override to send a custom
     * message to the user.
     */
    public static readonly FlaggedOutputActionName = '___FlaggedOutput___';

    /**
     * An action that will be called anytime the planner encounters an HTTP response with
     * status code >= `400`.
     */
    public static readonly HttpErrorActionName = '___HttpError___';

    /**
     * The task either executed too many steps or timed out.
     */
    public static readonly TooManyStepsActionName = '___TooManySteps___';

    /**
     * An action that will be called after the plan has been predicted by the planner and it has
     * passed moderation.
     * @remarks
     * Overriding this action lets you customize the decision to execute a plan separately from the
     * moderator. The default behavior is to proceed with the plans execution only with a plan
     * contains one or more commands. Returning false from this action can be used to prevent the plan
     * from being executed.
     */
    public static readonly PlanReadyActionName = '___PlanReady___';

    /**
     * An action that is called to DO an action.
     * @remarks
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
     * @remarks
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
        this._options = Object.assign(
            {
                max_steps: 25,
                max_time: 300000,
                allow_looping: true,
                enable_feedback_loop: false
            },
            options
        ) as ConfiguredAIOptions<TState>;

        // Create moderator if needed
        if (!this._options.moderator) {
            this._options.moderator = new DefaultModerator<TState>();
        }

        this.defaultAction(AI.UnknownActionName, actions.unknown());
        this.defaultAction(AI.FlaggedInputActionName, actions.flaggedInput());
        this.defaultAction(AI.FlaggedOutputActionName, actions.flaggedOutput());
        this.defaultAction(AI.HttpErrorActionName, actions.httpError());
        this.defaultAction(AI.PlanReadyActionName, actions.planReady());
        this.defaultAction(AI.DoCommandActionName, actions.doCommand());
        this.defaultAction(AI.SayCommandActionName, actions.sayCommand(this._options.enable_feedback_loop));
        this.defaultAction(AI.TooManyStepsActionName, actions.tooManySteps());
    }

    /**
     * Returns the moderator being used by the AI system.
     * @remarks
     * The default moderator simply allows all messages and plans through without intercepting them.
     * @returns {Moderator} The AI's moderator
     */
    public get moderator(): Moderator<TState> {
        return this._options.moderator;
    }

    /**
     * @returns {Planner<TState>} Returns the planner being used by the AI system.
     */
    public get planner(): Planner<TState> {
        return this._options.planner;
    }

    /**
     * Registers a handler for a named action.
     * @remarks
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
     * @template TParameters Optional. The type of parameters that the action handler expects.
     * @param {string | string[]} name Unique name of the action.
     * @param {actions.ActionHandler} handler The code to execute when the action's name is triggered.
     * @returns {this} The AI system instance for chaining purposes.
     */
    public action<TParameters extends Record<string, any> | undefined>(
        name: string | string[],
        handler: actions.ActionHandler<TState, TParameters>
    ): this {
        (Array.isArray(name) ? name : [name]).forEach((n) => {
            if (!this._actions.has(n)) {
                this._actions.set(n, { handler, allowOverrides: false });
            } else {
                const entry = this._actions.get(n);
                if (entry!.allowOverrides) {
                    entry!.handler = handler;
                    entry!.allowOverrides = false; // Only override once
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
     * @remarks
     * @param {string | string[]} name - Unique name of the action.
     * @template TParameters - Optional. The type of parameters that the action handler expects.
     * @param {actions.ActionHandler<TState, TParameters>} handler - The code to execute when the action's name is triggered.
     * Default handlers can be replaced by calling the action() method with the same name.
     * @returns {this} The AI system instance for chaining purposes.
     */
    public defaultAction<TParameters extends Record<string, any> | undefined>(
        name: string | string[],
        handler: actions.ActionHandler<TState, TParameters>
    ): this {
        (Array.isArray(name) ? name : [name]).forEach((n) => {
            this._actions.set(n, { handler, allowOverrides: true });
        });

        return this;
    }

    /**
     * Manually executes a named action.
     * @template TParameters Optional. Type of entities expected to be passed to the action.
     * @param {TurnContext} context Current turn context.
     * @param {TState} state Current turn state.
     * @param {string} action Name of the action to execute.
     * @param {TParameters} parameters Optional. Entities to pass to the action.
     * @returns {Promise<string>} The result of the action.
     */
    public async doAction<TParameters = Record<string, any>>(
        context: TurnContext,
        state: TState,
        action: string,
        parameters?: TParameters
    ): Promise<string> {
        if (!this._actions.has(action)) {
            throw new Error(`Can't find an action named '${action}'.`);
        }

        const handler = this._actions.get(action)!.handler;
        return await handler(context, state, parameters, action);
    }

    /**
     * Checks to see if the AI system has a handler for a given action.
     * @param {string} action Name of the action to check.
     * @returns {boolean} True if the AI system has a handler for the given action.
     */
    public hasAction(action: string): boolean {
        return this._actions.has(action);
    }

    /**
     * Calls the configured planner to generate a plan and executes the plan that is returned.
     * @remarks
     * The moderator is called to review the input and output of the plan. If the moderator flags
     * the input or output then the appropriate action is called. If the moderator allows the input
     * and output then the plan is executed.
     * @param {TurnContext} context Current turn context.
     * @param {TState} state Current turn state.
     * @param {number} start_time Optional. Time the AI system started running
     * @param {number} step_count Optional. Number of steps that have been executed.
     * @returns {Promise<boolean>} True if the plan was completely executed, otherwise false.
     */
    public async run(context: TurnContext, state: TState, start_time?: number, step_count?: number): Promise<boolean> {
        // Initialize start time and action count
        const { max_steps, max_time } = this._options;
        if (start_time === undefined) {
            start_time = Date.now();
        }
        if (step_count === undefined) {
            step_count = 0;
        }

        // Review input on first loop
        let plan: Plan | undefined =
            step_count == 0 ? await this._options.moderator.reviewInput(context, state) : undefined;

        // Generate plan
        if (!plan) {
            if (step_count == 0) {
                plan = await this._options.planner.beginTask(context, state, this);
            } else {
                plan = await this._options.planner.continueTask(context, state, this);
            }

            // Review the plans output
            plan = await this._options.moderator.reviewOutput(context, state, plan);
        }

        // Process generated plan
        let completed = false;
        const response = await this._actions
            .get(AI.PlanReadyActionName)!
            .handler(context, state, plan, AI.PlanReadyActionName);
        if (response == AI.StopCommandName) {
            return false;
        }

        // Run predicted commands
        // - If the plan ends on a SAY command then the plan is considered complete, otherwise we'll loop
        completed = true;
        let should_loop = false;
        for (let i = 0; i < plan.commands.length; i++) {
            // Check for timeout
            if (Date.now() - start_time! > max_time || ++step_count! > max_steps) {
                completed = false;
                const parameters: actions.TooManyStepsParameters = {
                    max_steps,
                    max_time,
                    start_time: start_time!,
                    step_count: step_count!
                };
                await this._actions
                    .get(AI.TooManyStepsActionName)!
                    .handler(context, state, parameters, AI.TooManyStepsActionName);
                break;
            }

            let output: string;
            const cmd = plan.commands[i];
            switch (cmd.type) {
                case 'DO': {
                    const { action } = cmd as PredictedDoCommand;
                    if (this._actions.has(action)) {
                        // Call action handler
                        const handler = this._actions.get(action)!.handler;
                        output = await this._actions
                            .get(AI.DoCommandActionName)!
                            .handler(context, state, { handler, ...(cmd as PredictedDoCommand) }, action);
                        should_loop = output.length > 0;
                        state.temp.actionOutputs[action] = output;
                    } else {
                        // Redirect to UnknownAction handler
                        output = await this._actions.get(AI.UnknownActionName)!.handler(context, state, plan, action);
                    }
                    break;
                }
                case 'SAY':
                    should_loop = false;
                    output = await this._actions
                        .get(AI.SayCommandActionName)!
                        .handler(context, state, cmd, AI.SayCommandActionName);
                    break;
                default:
                    throw new Error(`AI.run(): unknown command of '${cmd.type}' predicted.`);
            }

            // Check for stop command
            if (output == AI.StopCommandName) {
                completed = false;
                break;
            }

            // Copy the actions output to the input
            state.temp.lastOutput = output;
            state.temp.input = output;
            state.temp.inputFiles = [];
        }

        // Check for looping
        if (completed && should_loop && this._options.allow_looping) {
            return await this.run(context, state, start_time, step_count);
        } else {
            return completed;
        }
    }
}
