/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';
import { StopCommandName } from './Action';

/**
 * @private
 * @returns {Function} An async function that logs an error and returns StopCommandName.
 */
export function unknown<TState extends TurnState = TurnState>() {
    return async (_context: TurnContext, _state: TState, _data: any, action?: string) => {
        console.error(`An AI action named "${action}" was predicted but no handler was registered.`);
        return StopCommandName;
    };
}
