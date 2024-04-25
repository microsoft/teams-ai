/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';
import { Plan } from '../planners';
import { StopCommandName } from './Action';

/**
 * @private
 */
export function planReady<TState extends TurnState = TurnState>() {
    return async (_context: TurnContext, _state: TState, plan: Plan) => {
        return Array.isArray(plan.commands) && plan.commands.length > 0 ? '' : StopCommandName;
    };
}
