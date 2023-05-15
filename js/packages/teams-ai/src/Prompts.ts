/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from './TurnState';

export interface CompletionConfig {
    temperature: number;
    top_p: number;
    presence_penalty: number;
    frequency_penalty: number;
    max_tokens: number;
    stop_sequences?: string[];
}

export interface InputParameter {
    name: string;
    description: string;
    defaultValue: string;
}

export interface InputConfig {
    parameters?: InputParameter[];
}

export interface PromptTemplateConfig {
    schema: number;
    type: string;
    description: string;
    completion: CompletionConfig;
    default_backends?: string[];
    input?: InputConfig;
}

export interface PromptTemplate {
    text: string;
    config: PromptTemplateConfig;
}

/**
 * Base class for all prompt managers.
 */
export interface PromptManager<TState extends TurnState> {
    /**
     * Adds a custom function <name> to the prompt manager.
     *
     * @param {string} name The name of the function
     * @param {Promise<any>} handler Promise to return on function name match
     * @param {boolean} allowOverrides Whether to allow overriding an existing function
     * @returns {this} The prompt manager
     */
    addFunction(
        name: string,
        handler: (context: TurnContext, state: TState) => Promise<any>,
        allowOverrides?: boolean
    ): this;
    addPromptTemplate(name: string, template: PromptTemplate): this;
    /**
     *
     * @param {TurnContext} context Current application turn context
     * @param {TurnState} state Current turn state
     * @param name Which function to invoke
     */
    invokeFunction(context: TurnContext, state: TState, name: string): Promise<any>;
    renderPrompt(context: TurnContext, state: TState, nameOrTemplate: string | PromptTemplate): Promise<PromptTemplate>;
}
