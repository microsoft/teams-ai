/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    TurnContext,
    TaskModuleTaskInfo,
    ActivityTypes,
    InvokeResponse,
    INVOKE_RESPONSE_KEY,
    TaskModuleResponse
} from 'botbuilder';
import { Application, RouteSelector } from './Application';
import { TurnState } from './TurnState';

const FETCH_INVOKE_NAME = `task/fetch`;
const SUBMIT_INVOKE_NAME = `task/submit`;
const DEFAULT_TASK_DATA_FILTER = 'verb';

/**
 * Options for TaskModules class.
 */
export interface TaskModulesOptions {
    /**
     * Data field to use to identify the verb of the handler to trigger.
     * @summary
     * When a task module is triggered, the field name specified here will be used to determine
     * the name of the verb for the handler to route the request to.
     *
     * Defaults to a value of 'verb'.
     */
    taskDataFilter?: string;
}

/**
 * TaskModules class to enable fluent style registration of handlers related to Task Modules.
 * @template TState Type of the turn state object being persisted.
 */
export class TaskModules<TState extends TurnState> {
    private readonly _app: Application<TState>;

    /**
     * Creates a new instance of the TaskModules class.
     * @param {Application} app Top level application class to register handlers with.
     */
    public constructor(app: Application<TState>) {
        this._app = app;
    }

    /**
     * Registers a handler to process the initial fetch of the task module.
     * @summary
     * Handlers should respond with either an initial TaskInfo object or a string containing
     * a message to display to the user.
     * @template TData Optional. Type of the data object being passed to the handler.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} verb - Name of the verb(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, data: TData) => Promise<TaskModuleTaskInfo | string>} handler - Function to call when the handler is triggered.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {TData} handler.data - Data object passed to the handler.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public fetch<TData extends Record<string, any> = Record<string, any>>(
        verb: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, data: TData) => Promise<TaskModuleTaskInfo | string>
    ): Application<TState> {
        (Array.isArray(verb) ? verb : [verb]).forEach((v) => {
            const filterField = this._app.options.taskModules?.taskDataFilter ?? DEFAULT_TASK_DATA_FILTER;
            const selector = createTaskSelector(v, filterField, FETCH_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== FETCH_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected TaskModules.fetch() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state, context.activity.value?.data ?? {});
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        // Format invoke response
                        let response: TaskModuleResponse;
                        if (typeof result == 'string') {
                            // Return message
                            response = {
                                task: {
                                    type: 'message',
                                    value: result
                                }
                            };
                        } else {
                            // Return card
                            response = {
                                task: {
                                    type: 'continue',
                                    value: result
                                }
                            };
                        }

                        // Queue up invoke response
                        await context.sendActivity({
                            value: { body: response, status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });
                    }
                },
                true
            );
        });
        return this._app;
    }

    /**
     * Registers a handler to process the submission of a task module.
     * @summary
     * Handlers should respond with another TaskInfo object, message string, or `null` to indicate
     * the task is completed.
     * @template TData Optional. Type of the data object being passed to the handler.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} verb - Name of the verb(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, data: TData) => Promise<TaskModuleTaskInfo | string | null | undefined>} handler - Function to call when the handler is triggered.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {TData} handler.data - Data object passed to the handler.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public submit<TData extends Record<string, any> = Record<string, any>>(
        verb: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (
            context: TurnContext,
            state: TState,
            data: TData
        ) => Promise<TaskModuleTaskInfo | string | null | undefined>
    ): Application<TState> {
        (Array.isArray(verb) ? verb : [verb]).forEach((v) => {
            const filterField = this._app.options.taskModules?.taskDataFilter ?? DEFAULT_TASK_DATA_FILTER;
            const selector = createTaskSelector(v, filterField, SUBMIT_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== SUBMIT_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected TaskModules.submit() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state, context.activity.value?.data ?? {});
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        // Format invoke response
                        let response: TaskModuleResponse | undefined = undefined;
                        if (typeof result == 'string') {
                            // Return message
                            response = {
                                task: {
                                    type: 'message',
                                    value: result
                                }
                            };
                        } else if (typeof result == 'object') {
                            // Return card
                            response = {
                                task: {
                                    type: 'continue',
                                    value: result as TaskModuleTaskInfo
                                }
                            };
                        }

                        // Queue up invoke response
                        await context.sendActivity({
                            value: { body: response, status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });
                    }
                },
                true
            );
        });
        return this._app;
    }
}

/**
 * Creates a route selector function for a given verb, filter field, and invoke name.
 * @param {string | RegExp | RouteSelector} verb - The verb to match.
 * @param {string} filterField - The field to use for filtering.
 * @param {string} invokeName - The name of the invoke action.
 * @returns {RouteSelector} The route selector function.
 * @private
 * @summary
 * This function is used to create a route selector function for a given verb, filter field, and invoke name.
 * The route selector function is used to match incoming requests to the appropriate handler function.
 */
function createTaskSelector(
    verb: string | RegExp | RouteSelector,
    filterField: string,
    invokeName: string
): RouteSelector {
    if (typeof verb == 'function') {
        // Return the passed in selector function
        return verb;
    } else if (verb instanceof RegExp) {
        // Return a function that matches the verb using a RegExp
        return (context: TurnContext) => {
            const isInvoke = context?.activity?.type == ActivityTypes.Invoke && context?.activity?.name == invokeName;
            const data = context?.activity?.value?.data;
            if (
                isInvoke &&
                typeof data == 'object' &&
                // eslint-disable-next-line security/detect-object-injection
                typeof data[filterField] == 'string' &&
                Object.keys(data).length === 1 // Ensure that data only contains the filterField property
            ) {
                // eslint-disable-next-line security/detect-object-injection
                return Promise.resolve(verb.test(data[filterField]));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match verb
        return (context: TurnContext) => {
            const isInvoke = context?.activity?.type == ActivityTypes.Invoke && context?.activity?.name == invokeName;
            const data = context?.activity?.value?.data;
            return Promise.resolve(
                // eslint-disable-next-line security/detect-object-injection
                isInvoke && typeof data == 'object' && data[filterField] == verb && Object.keys(data).length === 1 // Ensure that data only contains the filterField property
            );
        };
    }
}
