/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';

/**
 * @private
 */
export const StopCommandName = 'STOP';

/**
 * The code to execute when the action's name is triggered.
 * @name ActionHandler
 * @function
 * @param {TurnContext} context The current turn context for the handler callback.
 * @template TState
 * @param {TState} state The current turn state for the handler callback.
 * @template TData
 * @param {TData} data The action payload.
 * @param {string | undefined} action The action name.
 * @returns {Promise<string>}
 */
export type ActionHandler<TState extends TurnState = TurnState, TData = any> = (
    context: TurnContext,
    state: TState,
    data: TData,
    action?: string
) => Promise<string>;

/**
 * @private
 */
export interface ActionEntry<TState extends TurnState = TurnState, TData = any> {
    handler: ActionHandler<TState, TData>;
    allowOverrides: boolean;
}
