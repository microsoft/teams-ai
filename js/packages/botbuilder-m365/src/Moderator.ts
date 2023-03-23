/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { ConfiguredAIOptions } from './AI';
import { Plan } from './Planner';
import { PromptTemplate } from './Prompts';
import { TurnState } from './TurnState';

export interface Moderator<TState extends TurnState> {
    reviewPrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan | undefined>;

    reviewPlan(context: TurnContext, state: TState, plan: Plan): Promise<Plan>;
}
