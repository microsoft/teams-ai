/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { AI } from '../AI';

/**
 * A planner is responsible for generating a plan that the AI system will execute.
 */
export interface Planner<TState extends TurnState> {
    /**
     * Completes a prompt and generates a plan for the AI system to execute.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param ai The AI system that is generating the plan.
     * @returns The plan that was generated.
     */
    generatePlan(
        context: TurnContext,
        state: TState,
        ai: AI<TState>
    ): Promise<Plan>;
}

/**
 * A plan is a set of commands that the AI system will execute.
 */
export interface Plan {
    /**
     * Type to indicate that a plan is being returned.
     */
    type: 'plan';

    /**
     * Array of predicted commands that the AI system should execute.
     */
    commands: PredictedCommand[];
}

/**
 * A predicted command is a command that the AI system should execute.
 */
export interface PredictedCommand {
    /**
     * Type of command to execute.
     * @summary
     * DO commands are actions that the AI system should perform. SAY commands are responses that
     * the AI system should say.
     */
    type: 'DO' | 'SAY';
}

/**
 * A predicted DO command is an action that the AI system should perform.
 */
export interface PredictedDoCommand extends PredictedCommand {
    /**
     * Type to indicate that a DO command is being returned.
     */
    type: 'DO';

    /**
     * The named action that the AI system should perform.
     */
    action: string;

    /**
     * Any parameters that the AI system should use to perform the action.
     */
    parameters: Record<string, any>;
}

/**
 * A predicted SAY command is a response that the AI system should say.
 */
export interface PredictedSayCommand extends PredictedCommand {
    /**
     * Type to indicate that a SAY command is being returned.
     */
    type: 'SAY';

    /**
     * The response that the AI system should say.
     */
    response: string;
}
