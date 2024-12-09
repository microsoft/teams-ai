/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { TurnState } from '../TurnState';
import { TooManyStepsParameters } from '../types';

/**
 * @private
 * @returns {Function} A function that checks if the AI system has exceeded the maximum number of steps or time allowed.
 */
export function tooManySteps<TState extends TurnState = TurnState>() {
    return async (_context: TurnContext, _state: TState, data: TooManyStepsParameters) => {
        if (data.step_count > data.max_steps) {
            throw new Error(`The AI system has exceeded the maximum number of steps allowed.`);
        }

        throw new Error(`The AI system has exceeded the maximum amount of time allowed.`);
    };
}
