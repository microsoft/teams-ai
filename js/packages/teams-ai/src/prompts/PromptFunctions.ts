/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { Tokenizer } from "../tokenizers";
import { Memory } from "../MemoryFork";


export interface PromptFunctions {
    hasFunction(name: string): boolean;
    getFunction(name: string): PromptFunction;
    invokeFunction(name: string, context: TurnContext, memory: Memory, tokenizer: Tokenizer, args: string[]): Promise<any>;
}

export type PromptFunction<TArgs = string[]> = (context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, args: TArgs) => Promise<any>;
