/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { Moderator } from './Moderator';
import { Plan } from '../planners';
import { TurnState } from '../TurnState';

/**
 * Default moderator created by the AI system if one isn't configured.
 * @remarks
 * The default moderator is a pass-through and always approves all inputs and outputs.
 * @template TState Optional. The Application's turn state.
 */
export class DefaultModerator<TState extends TurnState = TurnState> implements Moderator<TState> {
    /**
     * Allows all prompts by returning undefined.
     * @param {TurnContext} context - The context object for the turn.
     * @param {TState} state - The current turn state.
     * @returns {Promise<Plan | undefined>} A promise that resolves to undefined.
     */
    public reviewInput(context: TurnContext, state: TState): Promise<Plan | undefined> {
        // Just allow prompt
        return Promise.resolve(undefined);
    }

    /**
     * Allows all plans by returning the plan as-is.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {Plan} plan - Plan generated by the planner.
     * @returns {Promise<Plan>} A promise that resolves to the plan.
     */
    public reviewOutput(context: TurnContext, state: TState, plan: Plan): Promise<Plan> {
        // Just approve generated plan
        return Promise.resolve(plan);
    }
}
