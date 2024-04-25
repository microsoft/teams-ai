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
 * Parameters passed to the AI.TooManyStepsActionName action.
 */
export interface TooManyStepsParameters {
    /**
     * Configured maximum number of steps allowed.
     */
    max_steps: number;

    /**
     * Configured maximum amount of time allowed.
     */
    max_time: number;

    /**
     * Time the AI system started processing the current activity.
     */
    start_time: number;

    /**
     * Number of steps that have been executed.
     */
    step_count: number;
}

/**
 * @private
 */
export function tooManySteps<TState extends TurnState = TurnState>() {
    return async (_context: TurnContext, _state: TState, data: TooManyStepsParameters) => {
        if (data.step_count > data.max_steps) {
            throw new Error(`The AI system has exceeded the maximum number of steps allowed.`);
        }

        throw new Error(`The AI system has exceeded the maximum amount of time allowed.`);
    };
}
