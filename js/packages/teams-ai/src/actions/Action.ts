import { TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';

/**
 * The code to execute when the action's name is triggered.
 * @name ActionHandler
 * @function
 * @param {TurnContext} context The current turn context for the handler callback.
 * @param {TState} state The current turn state for the handler callback.
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
