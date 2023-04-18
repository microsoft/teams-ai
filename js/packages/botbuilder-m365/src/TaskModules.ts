/**
 * @module botbuilder-m365
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
    TaskModuleResponse,
    MessagingExtensionResult,
    MessagingExtensionActionResponse,
    Activity
} from 'botbuilder';
import { Application, RouteSelector } from './Application';
import { TurnState } from './TurnState';

const FETCH_INVOKE_NAME = `task/fetch`;
const SUBMIT_INVOKE_NAME = `task/submit`;
const DEFAULT_TASK_DATA_FILTER = 'verb';


export interface TaskModulesOptions {
    taskDataFilter?: string;
}

export class TaskModules<TState extends TurnState> {
    private readonly _app: Application<TState>;

    public constructor(app: Application<TState>) {
        this._app = app;
    }

    public fetch<TData>(
        verb: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (
            context: TurnContext,
            state: TState,
            data: TData
            ) => Promise<TaskModuleTaskInfo | string>
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

    public submit<TData>(
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
                        let response: TaskModuleResponse;
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
                        } else {
                            response = {
                                task: undefined
                            }
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
 *
 * @param {string | RegExp | RouteSelector[]} verb Name of the verb
 * @param {string} filterField Name of the data field used to filter verbs
 * @param {boolean} invokeName Name of the expected invoke activity
 * @returns {RouteSelector} Route selector function
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
            if (
                isInvoke &&
                typeof context?.activity?.value?.data == 'object' &&
                typeof context.activity.value.data[filterField] == 'string'
            ) {
                return Promise.resolve(verb.test(context.activity.value.data[filterField]));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match verb
        return (context: TurnContext) => {
            const isInvoke = context?.activity?.type == ActivityTypes.Invoke && context?.activity?.name == invokeName;
            return Promise.resolve(
                isInvoke &&
                typeof context?.activity?.value?.data == 'object' &&
                context.activity.value.data[filterField] == verb
            );
        };
    }
}
