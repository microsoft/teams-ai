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
export function httpError<TState extends TurnState = TurnState>() {
    return async (_context: TurnContext, _state: TState, err?: Error): Promise<string> => {
        throw err || new Error(`An AI http request failed`);
    };
}
