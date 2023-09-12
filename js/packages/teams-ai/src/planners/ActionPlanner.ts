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


    /**
     * Creates a semantic function that can be registered with the apps prompt manager.
     * @param {string} name The name of the semantic function.
     * @param {PromptTemplate} template The prompt template to use.
     * @param {Partial<AIOptions<TState>>} options Optional. Override options for the prompt. If omitted, the AI systems configured options will be used.
     * @summary
     * Semantic functions are functions that make model calls and return their results as template
     * parameters to other prompts. For example, you could define a semantic function called
     * 'translator' that first translates the user's input to English before calling your main prompt:
     *
     * ```JavaScript
     * app.ai.prompts.addFunction('translator', app.ai.createSemanticFunction('translator-prompt'));
     * ```
     *
     * You would then create a prompt called "translator-prompt" that does the translation and then in
     * your main prompt you can call it using the template expression `{{translator}}`.
     * @returns {Promise<any>} A promise that resolves to the result of the semantic function.
     */
    public createSemanticFunction(
        name: string,
        template?: PromptTemplate,
        options?: Partial<AIOptions<TState>>
    ): (context: TurnContext, state: TState) => Promise<any> {
        // Cache prompt template if being dynamically assigned
        if (template) {
            this._options.promptManager.addPromptTemplate(name, template);
        }

        return (context: TurnContext, state: TState) => this.completePrompt(context, state, name, options);
    }

}