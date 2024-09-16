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
    TaskModuleResponse,
    MessagingExtensionResult,
    MessagingExtensionActionResponse,
    MessagingExtensionParameter,
    MessagingExtensionQuery,
    Activity
} from 'botbuilder';
import { Application, RouteSelector, Query } from './Application';
import { TurnState } from './TurnState';

/**
 * @private
 */
const ANONYMOUS_QUERY_LINK_INVOKE_NAME = `composeExtension/anonymousQueryLink`;

/**
 * @private
 */
const FETCH_TASK_INVOKE_NAME = `composeExtension/fetchTask`;

/**
 * @private
 */
const QUERY_INVOKE_NAME = `composeExtension/query`;

/**
 * @private
 */
const QUERY_LINK_INVOKE_NAME = `composeExtension/queryLink`;

/**
 * @private
 */
const SELECT_ITEM_INVOKE_NAME = `composeExtension/selectItem`;

/**
 * @private
 */
const SUBMIT_ACTION_INVOKE_NAME = `composeExtension/submitAction`;

/**
 * MessageExtensions class to enable fluent style registration of handlers related to Message Extensions.
 * @template TState Type of the turn state object being persisted.
 */
export class MessageExtensions<TState extends TurnState> {
    private readonly _app: Application<TState>;

    /**
     * Creates a new instance of the MessageExtensions class.
     * @param {Application} app Top level application class to register handlers with.
     */
    public constructor(app: Application<TState>) {
        this._app = app;
    }

    /**
     * Registers a handler for a command that performs anonymous link unfurling.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} commandId - ID of the command(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, url: string) => Promise<MessagingExtensionResult>} handler - Function to call when the command is received. The handler should return a `MessagingExtensionResult`.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {string} handler.url - URL to unfurl.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public anonymousQueryLink(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, url: string) => Promise<MessagingExtensionResult>
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
                    const result = await handler(context, state, context.activity.value?.url ?? '');
                    if (!context.turnState.get(INVOKE_RESPONSE_KEY)) {
                        // Format invoke response
                        const response = {
                            composeExtension: result
                        };

                        // Queue up invoke response
                        await context.sendActivity({
                            value: { body: response, status: 200 },
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
     * Registers a handler to process the 'edit' action of a message that's being previewed by the
     * user prior to sending.
     * @summary
     * This handler is called when the user clicks the 'Edit' button on a message that's being
     * previewed prior to insertion into the current chat. The handler should return a new
     * view that allows the user to edit the message.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} commandId - ID of the command(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, previewActivity: Partial<Activity>) => Promise<MessagingExtensionResult | TaskModuleTaskInfo | string | null | undefined>} handler - Function to call when the command is received.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {Partial<Activity>} handler.previewActivity - The activity that's being previewed by the user.
     * @returns {Application<TState>} The application for chaining purposes.
     */
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

    /**
     * Registers a handler to process the 'send' action of a message that's being previewed by the
     * user prior to sending.
     * @summary
     * This handler is called when the user clicks the 'Send' button on a message that's being
     * previewed prior to insertion into the current chat. The handler should complete the flow
     * by sending the message to the current chat.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} commandId - ID of the command(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, previewActivity: Partial<Activity>) => Promise<void>} handler - Function to call when the command is received.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {Partial<Activity>} handler.previewActivity - The activity that's being previewed by the user.
     * @returns {Application<TState>} The application for chaining purposes.
     */
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

    /**
     * Registers a handler to process the initial fetch task for an Action based message extension.
     * @summary
     * Handlers should response with either an initial TaskInfo object or a string containing
     * a message to display to the user.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} commandId - ID of the command(s) to register the handler for.
     * @param {(context: TurnContext, state: TState) => Promise<TaskModuleTaskInfo | string>} handler - Function to call when the command is received.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @returns {Application<TState>} The application for chaining purposes.
     */
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

    /**
     * Registers a handler that implements a Search based Message Extension.
     * @summary
     * This handler is called when the user submits a query to a Search based Message Extension.
     * The handler should return a MessagingExtensionResult containing the results of the query.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} commandId - ID of the command(s) to register the handler for.
     * @template TParams
     * @param {(context: TurnContext, state: TState, query: Query<TParams>) => Promise<MessagingExtensionResult>} handler - Function to call when the command is received.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {Query<TParams>} handler.query - The query parameters that were sent by the client.
     * @returns {Application<TState>} The application for chaining purposes.
     */
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

    /**
     * Registers a handler that implements a Link Unfurling based Message Extension.
     * @param {(string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[])} commandId - ID of the command(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, url: string) => Promise<MessagingExtensionResult>} handler - Function to call when the command is received.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {string} handler.url - The URL that should be unfurled.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public queryLink(
        commandId: string | RegExp | RouteSelector | (string | RegExp | RouteSelector)[],
        handler: (context: TurnContext, state: TState, url: string) => Promise<MessagingExtensionResult>
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
                    const result = await handler(context, state, context.activity.value?.url);
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

    /**
     * Registers a handler that implements the logic to handle the tap actions for items returned
     * by a Search based message extension.
     * @summary
     * The `composeExtension/selectItem` INVOKE activity does not contain any sort of command ID,
     * so only a single select item handler can be registered. Developers will need to include a
     * type name of some sort in the preview item they return if they need to support multiple
     * select item handlers.
     * @template TItem Optional. Type of the item being selected.
     * @param {(context: TurnContext, state: TState, item: TItem) => Promise<MessagingExtensionResult>} handler Function to call when the command is received.
     * @param {TurnContext} handler.context Context for the current turn of conversation with the user.
     * @param {TState} handler.state Current state of the turn.
     * @param {TItem} handler.item The item that was selected.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public selectItem<TItem extends Record<string, any> = Record<string, any>>(
        handler: (context: TurnContext, state: TState, item: TItem) => Promise<MessagingExtensionResult>
    ): Application<TState> {
        // Define static route selector
        const selector = (context: TurnContext) =>
            Promise.resolve(
                context?.activity?.type == ActivityTypes.Invoke && context?.activity.name === SELECT_ITEM_INVOKE_NAME
            );

        // Add route
        this._app.addRoute(
            selector,
            async (context, state) => {
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
            },
            true
        );

        return this._app;
    }

    /**
     * Registers a handler that implements the submit action for an Action based Message Extension.
     * @template TData Optional. Type of data being submitted.
     * @param {string | RegExp | RouteSelector | string[] | RegExp[] | RouteSelector[]} commandId ID of the command(s) to register the handler for.
     * @param {(context: TurnContext, state: TState, data: TData) => Promise<MessagingExtensionResult | TaskModuleTaskInfo | string | null | undefined>} handler Function to call when the command is received.
     * @param {TurnContext} handler.context Context for the current turn of conversation with the user.
     * @param {TState} handler.state Current state of the turn.
     * @param {TData} handler.data The data that was submitted.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public submitAction<TData extends Record<string, any>>(
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

    /**
     * Sends the response for a submit action.
     * @param {TurnContext} context The context object for the current turn of conversation with the user.
     * @param {MessagingExtensionResult | TaskModuleTaskInfo | string | null | undefined} result The result of the submit action.
     * @private
     */
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
 * Creates a route selector function for a task module command.
 * @param {string | RegExp | RouteSelector} commandId The ID of the command to register the handler for.
 * @param {string} invokeName The name of the invoke activity.
 * @param {'edit' | 'send'} botMessagePreviewAction The bot message preview action to match.
 * @returns {RouteSelector} The route selector function.
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
 * Checks if the bot message preview action matches the specified action.
 * @param {Activity} activity The activity to check.
 * @param {'edit' | 'send'} botMessagePreviewAction The bot message preview action to match.
 * @returns {boolean} True if the bot message preview action matches, false otherwise.
 */
function matchesPreviewAction(activity: Activity, botMessagePreviewAction?: 'edit' | 'send'): boolean {
    if (typeof activity?.value?.botMessagePreviewAction == 'string') {
        return activity.value.botMessagePreviewAction == botMessagePreviewAction;
    } else {
        return botMessagePreviewAction == undefined;
    }
}
