/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { TurnState } from "../TurnState";
import { Tokenizer } from "../tokenizers";


export interface PromptFunctions<TState extends TurnState = TurnState> {
    hasFunction(name: string): boolean;
    getFunction(name: string): PromptFunction<TState>;
    invokeFunction(name: string, context: TurnContext, state: TState, tokenizer: Tokenizer, args: string[]): Promise<any>;
}

export type PromptFunction<TState extends TurnState = TurnState, TArgs = any> = (context: TurnContext, state: TState, functions: PromptFunctions, tokenizer: Tokenizer, args: TArgs) => Promise<any>;
