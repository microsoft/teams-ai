/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { ConfiguredAIOptions } from './AI';
import { PromptTemplate } from './Prompts';
import { TurnState } from './TurnState';

export interface Planner<TState extends TurnState> {
    completePrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options?: ConfiguredAIOptions<TState>
    ): Promise<string|undefined>;

    generatePlan(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options?: ConfiguredAIOptions<TState>
    ): Promise<Plan>;
}

export interface Plan {
    type: 'plan',
    commands: PredictedCommand[];
}

export interface PredictedCommand {
    type: 'DO' | 'SAY';
}

export interface PredictedDoCommand extends PredictedCommand {
    type: 'DO';
    action: string;
    entities: Record<string, any>;
}

export interface PredictedSayCommand extends PredictedCommand {
    type: 'SAY';
    response: string;
}
