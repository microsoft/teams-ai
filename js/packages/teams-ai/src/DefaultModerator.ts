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

export class DefaultModerator<TState extends TurnState = DefaultTurnState> implements Moderator<TState> {
    reviewPrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan | undefined> {
        // Just allow prompt
        return Promise.resolve(undefined);
    }

    reviewPlan(context: TurnContext, state: TState, plan: Plan): Promise<Plan> {
        // Just approve generated plan
        return Promise.resolve(plan);
    }
}
