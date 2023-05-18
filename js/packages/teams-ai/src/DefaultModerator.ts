/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { ConfiguredAIOptions } from './AI';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { Moderator } from './Moderator';
import { Plan } from './Planner';
import { PromptTemplate } from './Prompts';
import { TurnState } from './TurnState';

/**
 * Default moderator created by the AI system if one isn't configured.
 * @remarks
 * The default moderator is a pass through and always approves all inputs and outputs.
 * @template TState Optional. Applications turn state.
 */
export class DefaultModerator<TState extends TurnState = DefaultTurnState> implements Moderator<TState> {
    /**
     * Allows all prompts by returning undefined.
     */
    public reviewPrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan | undefined> {
        // Just allow prompt
        return Promise.resolve(undefined);
    }

    /**
     * Allows all plans by return the plan as is.
     */
    public reviewPlan(context: TurnContext, state: TState, plan: Plan): Promise<Plan> {
        // Just approve generated plan
        return Promise.resolve(plan);
    }
}
