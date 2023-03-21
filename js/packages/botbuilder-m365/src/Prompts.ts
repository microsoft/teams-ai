/**
 * @module botbuilder-m365
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { TurnState } from "./TurnState";

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

export interface PromptManager<TState extends TurnState> {
    addFunction(name: string, handler: (context: TurnContext, state: TState) => Promise<any>, allowOverrides?: boolean): this;
    addPromptTemplate(name: string, template: PromptTemplate): this;
    invokeFunction(context: TurnContext, state: TState, name: string): Promise<any>;
    renderPrompt(context: TurnContext, state: TState, nameOrTemplate: string|PromptTemplate): Promise<PromptTemplate>;
}