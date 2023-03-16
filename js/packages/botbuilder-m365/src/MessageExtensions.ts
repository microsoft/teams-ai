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
    MessagingExtensionParameter,
    MessagingExtensionQuery,
    Activity
} from 'botbuilder';
import Application, { RouteSelector, Query } from './Application';
import { TurnState } from './TurnState';

const ANONYMOUS_QUERY_LINK_INVOKE_NAME = `composeExtension/anonymousQueryLink`;
const FETCH_TASK_INVOKE_NAME = `composeExtension/fetchTask`;
const QUERY_INVOKE_NAME = `composeExtension/query`;
const QUERY_LINK_INVOKE_NAME = `composeExtension/queryLink`;
const SELECT_ITEM_INVOKE_NAME = `composeExtension/selectItem`;
const SUBMIT_ACTION_INVOKE_NAME = `composeExtension/submitAction`;

export class MessageExtensions<TState extends TurnState> {
    private readonly _app: Application<TState>;

    public constructor(app: Application<TState>) {
        this._app = app;
    }

    public anonymousQueryLink(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState) => Promise<MessagingExtensionResult>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, ANONYMOUS_QUERY_LINK_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== ANONYMOUS_QUERY_LINK_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.anonymousQueryLink() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state);
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        // Format invoke response
                        const response: MessagingExtensionActionResponse = {
                            composeExtension: result
                        };

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

    public botMessagePreviewEdit(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (
            context: TurnContext,
            state: TState,
            previewActivity: Partial<Activity>
        ) => Promise<MessagingExtensionResult | TaskModuleTaskInfo | string | null | undefined>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, SUBMIT_ACTION_INVOKE_NAME, 'edit');
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== SUBMIT_ACTION_INVOKE_NAME ||
                        context?.activity?.value?.botMessagePreviewAction !== 'edit'
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.botMessagePreviewEdit() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state, context.activity.value?.botActivityPreview[0] ?? {});
                    await this.returnSubmitActionResponse(context, result);
                },
                true
            );
        });
        return this._app;
    }

    public botMessagePreviewSend(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, previewActivity: Partial<Activity>) => Promise<void>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, SUBMIT_ACTION_INVOKE_NAME, 'send');
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== SUBMIT_ACTION_INVOKE_NAME ||
                        context?.activity?.value?.botMessagePreviewAction !== 'send'
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.botMessagePreviewSend() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    await handler(context, state, context.activity.value?.botActivityPreview[0] ?? {});

                    // Queue up invoke response
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        await context.sendActivity({
                            value: { body: {}, status: 200 } as InvokeResponse,
                            type: ActivityTypes.InvokeResponse
                        });
                    }
                },
                true
            );
        });
        return this._app;
    }

    public fetchTask(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState) => Promise<TaskModuleTaskInfo | string>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, FETCH_TASK_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== FETCH_TASK_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.fetchTask() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state);
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

    public query<TParams extends Record<string, any> = Record<string, any>>(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, query: Query<TParams>) => Promise<MessagingExtensionResult>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, QUERY_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== QUERY_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.query() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Flatten query options
                    const meQuery: MessagingExtensionQuery = context?.activity?.value ?? {};
                    const query: Query<TParams> = {
                        count: meQuery?.queryOptions?.count ?? 25,
                        skip: meQuery?.queryOptions?.skip ?? 0,
                        parameters: {} as TParams
                    };

                    // Flatten query parameters
                    (meQuery.parameters ?? []).forEach((param: MessagingExtensionParameter) => {
                        if (param.name) {
                            (query.parameters as any)[param.name] = param.value;
                        }
                    });

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state, query);
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        // Format invoke response
                        const response: MessagingExtensionActionResponse = {
                            composeExtension: result
                        };

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

    public queryLink(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState) => Promise<MessagingExtensionResult>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, QUERY_LINK_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== QUERY_LINK_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.queryLink() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state);
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        // Format invoke response
                        const response: MessagingExtensionActionResponse = {
                            composeExtension: result
                        };

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

    public selectItem(
        handler: (context: TurnContext, state: TState, item: Record<string, any>) => Promise<MessagingExtensionResult>
    ): Application<TState> {
        // Define static route selector
        const selector = (context: TurnContext) =>
            Promise.resolve(
                context?.activity?.type == ActivityTypes.Invoke && context?.activity.name === SELECT_ITEM_INVOKE_NAME
            );

        // Add route
        this._app.addRoute(selector, async (context, state) => {
            // Call handler and then check to see if an invoke response has already been added
            const result = await handler(context, state, context?.activity?.value ?? {});
            if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                // Format invoke response
                const response: MessagingExtensionActionResponse = {
                    composeExtension: result
                };

                // Queue up invoke response
                await context.sendActivity({
                    value: { body: response, status: 200 } as InvokeResponse,
                    type: ActivityTypes.InvokeResponse
                });
            }
        }),
            true;
        return this._app;
    }

    public submitAction<TData = Record<string, any>>(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (
            context: TurnContext,
            state: TState,
            data: TData
        ) => Promise<MessagingExtensionResult | TaskModuleTaskInfo | string | null | undefined>
    ): Application<TState> {
        (Array.isArray(commandId) ? commandId : [commandId]).forEach((cid) => {
            const selector = createTaskSelector(cid, SUBMIT_ACTION_INVOKE_NAME);
            this._app.addRoute(
                selector,
                async (context, state) => {
                    // Insure that we're in an invoke as expected
                    if (
                        context?.activity?.type !== ActivityTypes.Invoke ||
                        context?.activity?.name !== SUBMIT_ACTION_INVOKE_NAME
                    ) {
                        throw new Error(
                            `Unexpected MessageExtensions.submitAction() triggered for activity type: ${context?.activity?.type}`
                        );
                    }

                    // Call handler and then check to see if an invoke response has already been added
                    const result = await handler(context, state, context.activity.value?.data ?? {});
                    await this.returnSubmitActionResponse(context, result);
                },
                true
            );
        });
        return this._app;
    }

    private async returnSubmitActionResponse(
        context: TurnContext,
        result: MessagingExtensionResult | TaskModuleTaskInfo | string | null | undefined
    ): Promise<void> {
        if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
            // Format invoke response
            let response: MessagingExtensionActionResponse;
            if (typeof result == 'string') {
                // Return message
                response = {
                    task: {
                        type: 'message',
                        value: result
                    }
                };
            } else if (typeof result == 'object') {
                if ((result as TaskModuleTaskInfo).card) {
                    // Return another task module
                    response = {
                        task: {
                            type: 'continue',
                            value: result as TaskModuleTaskInfo
                        }
                    };
                } else {
                    // Return card to user
                    response = {
                        composeExtension: result as MessagingExtensionResult
                    };
                }
            } else {
                // No action taken
                response = {
                    composeExtension: undefined
                };
            }

            // Queue up invoke response
            await context.sendActivity({
                value: { body: response, status: 200 } as InvokeResponse,
                type: ActivityTypes.InvokeResponse
            });
        }
    }
}

/**
 * @param commandId
 * @param invokeName
 * @param botMessagePreviewAction
 */
function createTaskSelector(
    commandId: string | RegExp | RouteSelector,
    invokeName: string,
    botMessagePreviewAction?: 'edit' | 'send'
): RouteSelector {
    if (typeof commandId == 'function') {
        // Return the passed in selector function
        return commandId;
    } else if (commandId instanceof RegExp) {
        // Return a function that matches the commandId using a RegExp
        return (context: TurnContext) => {
            const isInvoke = context?.activity?.type == ActivityTypes.Invoke && context?.activity?.name == invokeName;
            if (
                isInvoke &&
                typeof context?.activity?.value?.commandId == 'string' &&
                matchesPreviewAction(context.activity, botMessagePreviewAction)
            ) {
                return Promise.resolve(commandId.test(context.activity.value.commandId));
            } else {
                return Promise.resolve(false);
            }
        };
    } else {
        // Return a function that attempts to match commandId
        return (context: TurnContext) => {
            const isInvoke = context?.activity?.type == ActivityTypes.Invoke && context?.activity?.name == invokeName;
            return Promise.resolve(
                isInvoke &&
                    context?.activity?.value?.commandId === commandId &&
                    matchesPreviewAction(context.activity, botMessagePreviewAction)
            );
        };
    }
}

/**
 * @param activity
 * @param botMessagePreviewAction
 */
function matchesPreviewAction(activity: Activity, botMessagePreviewAction?: 'edit' | 'send'): boolean {
    if (typeof activity?.value?.botMessagePreviewAction == 'string') {
        return activity.value.botMessagePreviewAction == botMessagePreviewAction;
    } else {
        return botMessagePreviewAction == undefined;
    }
}
