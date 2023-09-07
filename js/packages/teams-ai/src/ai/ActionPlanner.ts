/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { PredictedDoCommand, Planner, Plan } from '../Planner';
import { TurnState } from '../TurnState';
import { TurnContext } from 'botbuilder';

export class ActionPlannerOpenAIPlanner<TState extends TurnState = TurnState> implements Planner<TState> {
    /**
     * Completes a prompt and generates a plan for the AI system to execute.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param prompt Prompt to complete.
     * @param options Configuration options for the AI system.
     * @returns The plan that was generated.
     */
    public async generatePlan(
        context: TurnContext,
        state: TState
    ): Promise<Plan> {

    }
}