/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';
import { PredictedDoCommand } from '../planners';

/**
 * Entities argument passed to the action handler for AI.DoCommandActionName.
 * @template TState Type of the turn state.
 */
export interface PredictedDoCommandAndHandler<TState> extends PredictedDoCommand {
    /**
     * The handler that should be called to execute the command.
     * @param context Current turn context.
     * @param state Current turn state.
     * @param parameters Optional parameters for the action.
     * @param action Name of the action being executed.
     * @returns Whether the AI system should continue executing the plan.
     */
    handler: (
        context: TurnContext,
        state: TState,
        parameters?: Record<string, any>,
        action?: string
    ) => Promise<string>;
}

/**
 * @private
 */
export function doCommand<TState extends TurnState = TurnState>() {
    return async (context: TurnContext, state: TState, data: PredictedDoCommandAndHandler<TState>, action?: string) => {
        return await data.handler(context, state, data.parameters, action);
    };
}
