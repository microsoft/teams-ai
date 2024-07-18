/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';

import { AI } from '../AI';
import { DefaultAugmentation } from '../augmentations';
import { Memory } from '../MemoryFork';
import { PromptCompletionModel } from '../models';
import { PromptTemplate, PromptManager } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { TurnState } from '../TurnState';
import { Utilities } from '../Utilities';
import { PromptResponse } from '../types';
import { PromptResponseValidator } from '../validators';

import { LLMClient } from './LLMClient';
import { Planner, Plan } from './Planner';

/**
 * Factory function used to create a prompt template.
 * @template TState Optional. Type of application state.
 * @param context Context for the current turn of conversation.
 * @param state Application state for the current turn of conversation.
 * @param planner The action planner that is generating the prompt.
 * @returns A promise that resolves to the prompt template to use.
 */
export type ActionPlannerPromptFactory<TState extends TurnState = TurnState> = (
    context: TurnContext,
    state: TState,
    planner: ActionPlanner<TState>
) => Promise<PromptTemplate>;

/**
 * Options used to configure an `ActionPlanner` instance.
 * @template TState Optional. Type of application state.
 */
export interface ActionPlannerOptions<TState extends TurnState = TurnState> {
    /**
     * Model instance to use.
     */
    model: PromptCompletionModel;

    /**
     * Prompt manager used to manage prompts.
     */
    prompts: PromptManager;

    /**
     * The default prompt to use.
     * @remarks
     * This can either be the name of a prompt template or a function that returns a prompt template.
     */
    defaultPrompt: string | ActionPlannerPromptFactory<TState>;

    /**
     * Maximum number of repair attempts to make.
     * @remarks
     * The ActionPlanner uses validators and a feedback loop to repair invalid responses returned
     * by the model. This value controls the maximum number of repair attempts that will be made
     * before returning an error. The default value is 3.
     */
    max_repair_attempts?: number;

    /**
     * Optional tokenizer to use.
     * @remarks
     * If not specified, a new `GPTTokenizer` instance will be created.
     */
    tokenizer?: Tokenizer;

    /**
     * If true, repair attempts will be logged to the console.
     * @remarks
     * The default value is false.
     */
    logRepairs?: boolean;

    /**
     * Optional message to send a client at the start of a streaming response.
     */
    startStreamingMessage?: string;
}

/**
 * A planner that uses a Large Language Model (LLM) to generate plans.
 * @remarks
 * The ActionPlanner is a powerful planner that uses a LLM to generate plans. The planner can
 * trigger parameterized actions and send text based responses to the user. The ActionPlanner
 * supports the following advanced features:
 * - **Augmentations:** Augmentations virtually eliminate the need for prompt engineering. Prompts
 *   can be configured to use a named augmentation which will be automatically appended to the outgoing
 *   prompt. Augmentations let the developer specify whether they want to support multi-step plans (sequence),
 *   use OpenAI's functions support (functions), or create an AutoGPT style agent (monologue).
 * - **Validations:** Validators are used to validate the response returned by the LLM and can guarantee
 *   that the parameters passed to an action mach a supplied schema. The validator used is automatically
 *   selected based on the augmentation being used. Validators also prevent hallucinated action names
 *   making it impossible for the LLM to trigger an action that doesn't exist.
 * - **Repair:** The ActionPlanner will automatically attempt to repair invalid responses returned by the
 *   LLM using a feedback loop. When a validation fails, the ActionPlanner sends the error back to the
 *   model, along with an instruction asking it to fix its mistake. This feedback technique leads to a
 *   dramatic reduction in the number of invalid responses returned by the model.
 * @template TState Optional. Type of application state.
 */
export class ActionPlanner<TState extends TurnState = TurnState> implements Planner<TState> {
    private readonly _options: ActionPlannerOptions<TState>;
    private readonly _promptFactory: ActionPlannerPromptFactory<TState>;
    private readonly _defaultPrompt?: string;

    /**
     * Creates a new `ActionPlanner` instance.
     * @param {ActionPlannerOptions<TState>} options Options used to configure the planner.
     */
    public constructor(options: ActionPlannerOptions<TState>) {
        this._options = Object.assign(
            {
                max_repair_attempts: 3,
                logRepairs: false
            },
            options
        );
        if (typeof this._options.defaultPrompt == 'function') {
            this._promptFactory = this._options.defaultPrompt;
        } else {
            this._defaultPrompt = this._options.defaultPrompt;
            this._promptFactory = () => this.prompts.getPrompt(this._defaultPrompt!);
        }
    }

    public get model(): PromptCompletionModel {
        return this._options.model;
    }

    public get prompts(): PromptManager {
        return this._options.prompts;
    }

    public get defaultPrompt(): string | undefined {
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
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {TState} state Application state for the current turn of conversation.
     * @param {AI<TState>} ai The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async beginTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
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
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {TState} state - Application state for the current turn of conversation.
     * @param {AI<TState>} ai - The AI system that is generating the plan.
     * @returns {Promise<Plan>} The plan that was generated.
     */
    public async continueTask(context: TurnContext, state: TState, ai: AI<TState>): Promise<Plan> {
        // Identify the prompt to use
        const template = await this._promptFactory(context, state, this);

        // Identify the augmentation to use
        const augmentation = template.augmentation ?? new DefaultAugmentation();

        // Complete prompt
        const result = await this.completePrompt(context, state, template, augmentation);
        if (result.status != 'success') {
            throw result.error!;
        }

        // Check to see if we have a response
        // - when a streaming response is used the response message will be undefined.
        if (result.message) {
            // Return plan
            return await augmentation.createPlanFromResponse(context, state, result);
        } else {
            // Return an empty plan
            return { type: 'plan', commands: [] };
        }
    }

    /**
     * Completes a prompt using an optional validator.
     * @remarks
     * This method allows the developer to manually complete a prompt and access the models
     * response. If a validator is specified, the response will be validated and repaired if
     * necessary. If no validator is specified, the response will be returned as-is.
     *
     * If a validator like the `JSONResponseValidator` is used, the response returned will be
     * a message containing a JSON object. If no validator is used, the response will be a
     * message containing the response text as a string.
     * @template TContent Optional. Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent. Defaults to `string`.     * @param context Context for the current turn of conversation.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory A memory interface used to access state variables (the turn state object implements this interface.)
     * @param {string | PromptTemplate} prompt - Name of the prompt to use or a prompt template.
     * @param {PromptResponseValidator<TContent>} validator - Optional. A validator to use to validate the response returned by the model.
     * @returns {Promise<PromptResponse<TContent>>} The result of the LLM call.
     */
    public async completePrompt<TContent = string>(
        context: TurnContext,
        memory: Memory,
        prompt: string | PromptTemplate,
        validator?: PromptResponseValidator<TContent>
    ): Promise<PromptResponse<TContent>> {
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
        const client = new LLMClient<TContent>({
            model,
            template,
            history_variable,
            input_variable,
            validator,
            tokenizer: this._options.tokenizer,
            max_history_messages: this.prompts.options.max_history_messages,
            max_repair_attempts: this._options.max_repair_attempts,
            logRepairs: this._options.logRepairs,
            startStreamingMessage: this._options.startStreamingMessage
        });

        // Complete prompt
        return await client.completePrompt(context, memory, this.prompts);
    }

    /**
     * Creates a semantic function that can be registered with the apps prompt manager.
     * @param {string | PromptTemplate} prompt - The name of the prompt to use.
     * @param {PromptResponseValidator<any>} validator - Optional. A validator to use to validate the response returned by the model.
     * @remarks
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
    public addSemanticFunction(prompt: string | PromptTemplate, validator?: PromptResponseValidator<any>): this {
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
