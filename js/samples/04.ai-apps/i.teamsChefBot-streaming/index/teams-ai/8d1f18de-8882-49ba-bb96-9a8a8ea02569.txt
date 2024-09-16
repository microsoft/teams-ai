/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from './TurnState';

/**
 * Interface for the completion configuration portion of a prompt template.
 */
export interface CompletionConfig {
    /**
     * The models temperature as a number between 0 and 1.
     */
    temperature: number;

    /**
     * The models top_p as a number between 0 and 1.
     */
    top_p: number;

    /**
     * The models presence_penalty as a number between 0 and 1.
     */
    presence_penalty: number;

    /**
     * The models frequency_penalty as a number between 0 and 1.
     */
    frequency_penalty: number;

    /**
     * The maximum number of tokens to generate.
     */
    max_tokens: number;

    /**
     * Optional. Array of stop sequences that when hit will stop generation.
     */
    stop_sequences?: string[];
}

/**
 * Serialized prompt template configuration.
 */
export interface PromptTemplateConfig {
    /**
     * The schema version of the prompt template. Should always be '1'.
     */
    schema: number;

    /**
     * Type of prompt template. Should always be 'completion'.
     */
    type: 'completion';

    /**
     * Description of the prompts purpose.
     */
    description: string;

    /**
     * Completion settings for the prompt.
     */
    completion: CompletionConfig;

    /**
     * Optional. Array of backends (models) to use for the prompt.
     * @summary
     * Passing the name of a model to use here will override the default model used by a planner.
     */
    default_backends?: string[];
}

/**
 * Prompt template cached by the prompt manager.
 */
export interface PromptTemplate {
    /**
     * Text of the prompt template.
     */
    text: string;

    /**
     * Configuration settings for the prompt template.
     */
    config: PromptTemplateConfig;
}

/**
 * Interface implemented by all prompt managers.
 */
export interface PromptManager<TState extends TurnState> {
    /**
     * Adds a custom function <name> to the prompt manager.
     * @summary
     * Functions added to the prompt manager can be invoked by name from within a prompt template.
     * @param name The name of the function.
     * @param handler Promise to return on function name match.
     * @param allowOverrides Whether to allow overriding an existing function.
     * @returns The prompt manager for chaining.
     */
    addFunction(
        name: string,
        handler: (context: TurnContext, state: TState) => Promise<any>,
        allowOverrides?: boolean
    ): this;

    /**
     * Adds a prompt template to the prompt manager.
     * @param name Name of the prompt template.
     * @param template Prompt template to add.
     * @returns The prompt manager for chaining.
     */
    addPromptTemplate(name: string, template: PromptTemplate): this;

    /**
     * Invokes a function by name.
     * @param context Current application turn context.
     * @param state Current turn state.
     * @param name Name of the function to invoke.
     * @returns The result returned by the function for insertion into a prompt.
     */
    invokeFunction(context: TurnContext, state: TState, name: string): Promise<any>;

    /**
     * Renders a prompt template by name.
     * @param context Current application turn context.
     * @param state Current turn state.
     * @param nameOrTemplate Name of the prompt template to render or a prompt template to render.
     * @returns The rendered prompt template.
     */
    renderPrompt(context: TurnContext, state: TState, nameOrTemplate: string | PromptTemplate): Promise<PromptTemplate>;
}
