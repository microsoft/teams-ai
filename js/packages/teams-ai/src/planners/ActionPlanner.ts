/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Planner, Plan } from './Planner';
import { TurnState } from '../TurnState';
import { TurnContext } from 'botbuilder';
import { AI } from '../AI';
import { PromptTemplate, PromptManager } from '../prompts';
import { PromptCompletionModel, PromptResponse } from '../models';
import { PromptResponseValidator } from '../validators';
import { Memory } from '../MemoryFork';
import { LLMClient } from './LLMClient';
import { Tokenizer } from '../tokenizers';
import { Utilities } from '../Utilities';
import { DefaultAugmentation } from '../augmentations';

export interface ActionPlannerOptions<TState extends TurnState = TurnState> {
    model: PromptCompletionModel;
    prompts: PromptManager;
    defaultPrompt: string|((context: TurnContext, state: TState, planner: ActionPlanner<TState>) => Promise<PromptTemplate>);
    max_repair_attempts?: number;
    tokenizer?: Tokenizer;
    logRepairs?: boolean;
}

export class ActionPlanner<TState extends TurnState = TurnState> implements Planner<TState> {
    private readonly _options: ActionPlannerOptions<TState>;
    private readonly _promptFactory: (context: TurnContext, state: TState, planner: ActionPlanner<TState>) => Promise<PromptTemplate>;
    private readonly _defaultPrompt?: string;

    public constructor(options: ActionPlannerOptions<TState>) {
        this._options = Object.assign({}, options);
        if (typeof this._options.defaultPrompt == 'function') {
            this._promptFactory = this._options.defaultPrompt;
        } else {
            this._defaultPrompt = this._options.defaultPrompt;
            this._promptFactory = (planner) => {
                return this.prompts.getPrompt(this._defaultPrompt!);
            };
        }
    }

    public get model(): PromptCompletionModel {
        return this._options.model;
    }

    public get prompts(): PromptManager {
        return this._options.prompts;
    }

    public get defaultPrompt(): string|undefined {
        return this._defaultPrompt;
    }

    /**
     * Starts a new task.
     * @remarks
     * This method is called when the AI system is ready to start a new task. The planner should
     * generate a plan that the AI system will execute. Returning an empty plan signals that
     * there is no work to be performed.
     *
     * The planner should take the users input from `state.temp.input`.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param ai The AI system that is generating the plan.
     * @returns The plan that was generated.
     */
    public async beginTask(
        context: TurnContext,
        state: TState,
        ai: AI<TState>
    ): Promise<Plan> {
        return await this.continueTask(context, state, ai);
    }

    /**
     * Continues the current task.
     * @remarks
     * This method is called when the AI system has finished executing the previous plan and is
     * ready to continue the current task. The planner should generate a plan that the AI system
     * will execute. Returning an empty plan signals that the task is completed and there is no work
     * to be performed.
     *
     * The output from the last plan step that was executed is passed to the planner via `state.temp.input`.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param ai The AI system that is generating the plan.
     * @returns The plan that was generated.
     */
    public async continueTask(
        context: TurnContext,
        state: TState,
        ai: AI<TState>
    ): Promise<Plan> {
        // Identify the prompt to use
        const template = await this._promptFactory(context, state, this);

        // Identify the augmentation to use
        const augmentation = template.augmentation ?? new DefaultAugmentation();

        // Complete prompt
        const result = await this.completePrompt(context, state, template, augmentation);
        if (result.status != 'success') {
            throw result.error!;
        }

        // Return plan
        return await augmentation.createPlanFromResponse(context, state, result);
    }

    public async completePrompt<TResult = string>(context: TurnContext, memory: Memory, prompt: string|PromptTemplate, validator?: PromptResponseValidator<TResult>): Promise<PromptResponse<TResult>> {
        // Cache prompt template if being dynamically assigned
        let name = '';
        if (typeof prompt == 'object') {
            // Add prompt if it doesn't exist
            if (!this.prompts.hasPrompt(prompt.name)) {
                this.prompts.addPrompt(prompt);
            }

            name = prompt.name;
        } else {
            name = prompt;
        }

        // Fetch cached template
        const template = await this.prompts.getPrompt(name);
        const model = this.model;

        // Compute variable names
        // - The LLM client needs history to work so if the prompt doesn't want history included we'll
        //   just tell the LLM client to use a temp variable instead.
        // - For prompts that include history we want each prompt to have its own history variable so
        //   we'll use the prompt name in the variable name.
        const include_history = template.config.completion.include_history;
        const history_variable = include_history ? `conversation.${name}_history` : `temp.${name}_history`;
        const input_variable = `temp.input`;

        // Create LLM client
        const client = new LLMClient<TResult>({
            model,
            template,
            history_variable,
            input_variable,
            validator,
            tokenizer: this._options.tokenizer,
            max_history_messages: this.prompts.options.max_history_messages,
            max_repair_attempts: this._options.max_repair_attempts,
            logRepairs: this._options.logRepairs,
        });

        // Complete prompt
        return await client.completePrompt(context, memory, this.prompts);
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
    public addSemanticFunction(
        prompt: string|PromptTemplate,
        validator?: PromptResponseValidator<any>,
    ): this {
        // Cache prompt template if being dynamically assigned
        let name = '';
        if (typeof prompt == 'object') {
            this._options.prompts.addPrompt(prompt);
            name = prompt.name;
        } else {
            name = prompt;
        }

        // Add semantic function
        this._options.prompts.addFunction(name, async (context, memory, functions, tokenizer, args) => {
            // Assign args to input
            if (Array.isArray(args)) {
                memory.setValue('temp.input', args.join(' '));
            } else if (args != undefined && args != null) {
                memory.setValue('temp.input', (args as any).toString());
            }

            // Complete prompt
            const result = await this.completePrompt(context, memory, prompt, validator);
            if (result.status == 'success') {
                return Utilities.toString(tokenizer, result.message!.content);
            } else {
                throw result.error!;
            }
        });
        return this;
    }

}