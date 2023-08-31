/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { DefaultTurnState } from './DefaultTurnStateManager';
import { Plan, Planner } from './Planner';
import { TurnState } from './TurnState';
import { PromptTemplate } from './Prompts';
import { ConfiguredAIOptions } from './AI';
import { AIApiFactory } from './AIApiFactory';

/**
 * A planner that uses OpenAI's textCompletion and chatCompletion API's to generate plans.
 * @summary
 * This planner can be configured to use different models for different prompts. The prompts model
 * will determine which API is used to generate the plan. Any model that starts with 'gpt-' will
 * use the chatCompletion API, otherwise the textCompletion API will be used.
 * @template TState Optional. Type of the applications turn state.
 * @template TOptions Optional. Type of the planner options.
 */
class PlannerImpl<TState extends TurnState = DefaultTurnState> implements Planner<TState> {
    /**
     * Creates a new instance of the OpenAI based planner.
     * @param {AIApiFactory<TState>} aiApiFactory AIApiFactory to be called by the planner.
     */
    public constructor(private readonly aiApiFactory: AIApiFactory<TState>) {}

    /**
     * Completes a prompt without returning a plan.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TState} state Application state for the current turn of conversation.
     * @param {PromptTemplate} prompt Prompt to complete.
     * @param {ConfiguredAIOptions<TState>} options Configuration options for the AI system.
     * @returns {Promise<string>} The response from the prompt. Can return undefined to indicate the prompt was rate limited.
     */
    public async completePrompt(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<string | undefined> {
        return this.aiApiFactory.completePrompt(context, state, prompt, options);
    }

    /**
     * Completes a prompt and generates a plan for the AI system to execute.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TState} state Application state for the current turn of conversation.
     * @param {PromptTemplate} prompt Prompt to complete.
     * @param {ConfiguredAIOptions<TState>} options Configuration options for the AI system.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async generatePlan(
        context: TurnContext,
        state: TState,
        prompt: PromptTemplate,
        options: ConfiguredAIOptions<TState>
    ): Promise<Plan> {
        return this.aiApiFactory.generatePlan(context, state, prompt, options);
    }
}

/**
 * @template TState
 * @param {AIApiFactory<TState>} aiApiFactory The API factory to use to create the API's for the planner.
 * @returns {Planner<TState>} A planner that uses OpenAI's textCompletion and chatCompletion API's to generate plans.
 */
export function createPlanner<TState extends TurnState = DefaultTurnState>(
    aiApiFactory: AIApiFactory<TState>
): Planner<TState> {
    if (!aiApiFactory) {
        throw new Error('createPlanner: API Factory is required');
    }
    return new PlannerImpl<TState>(aiApiFactory);
}
