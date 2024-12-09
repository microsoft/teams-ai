/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ActivityTypes,
    Channels,
    INVOKE_RESPONSE_KEY,
    InvokeResponse,
    TaskModuleResponse,
    TaskModuleTaskInfo,
    TurnContext
} from 'botbuilder';
import { Application } from './Application';
import { TurnState } from './TurnState';

export enum MessageInvokeNames {
    FETCH_INVOKE_NAME = `message/fetchTask`
}

/**
 * TaskModules class to enable fluent style registration of handlers related to Task Modules.
 * @template TState Type of the turn state object being persisted.
 */
export class Messages<TState extends TurnState> {
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
     * @remarks
     * Handlers should respond with either an initial TaskInfo object or a string containing
     * a message to display to the user.
     * @template TData Optional. Type of the data object being passed to the handler.
     * @param {(context: TurnContext, state: TState, data: TData) => Promise<TaskModuleTaskInfo | string>} handler - Function to call when the handler is triggered.
     * @param {TurnContext} handler.context - Context for the current turn of conversation with the user.
     * @param {TState} handler.state - Current state of the turn.
     * @param {TData} handler.data - Data object passed to the handler.
     * @returns {Application<TState>} The application for chaining purposes.
     */
    public fetch<TData extends Record<string, any> = Record<string, any>>(
        handler: (context: TurnContext, state: TState, data: TData) => Promise<TaskModuleTaskInfo | string>
    ): Application<TState> {
        this._app.addRoute(
            async (context) => {
                return (
                    context?.activity?.type === ActivityTypes.Invoke &&
                    context?.activity?.name === MessageInvokeNames.FETCH_INVOKE_NAME
                );
            },
            async (context, state) => {
                if (context?.activity?.channelId === Channels.Msteams) {
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
                }
            },
            true
        );

        return this._app;
    }
}
