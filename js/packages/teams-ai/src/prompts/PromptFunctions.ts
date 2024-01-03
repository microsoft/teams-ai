/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * A collection of functions that can be called from a prompt template string.
 */
export interface PromptFunctions {
    /**
     * Returns true if the given function is defined.
     * @param name Name of the function to lookup.
     */
    hasFunction(name: string): boolean;

    /**
     * Looks up the given function.
     * @remarks
     * Throws an error if the function is not defined.
     * @param name Name of the function to lookup.
     */
    getFunction(name: string): PromptFunction;

    /**
     * Calls the given function.
     * @remarks
     * Throws an error if the function is not defined.
     * @param name Name of the function to invoke.
     * @param context Context for the current turn of conversation.
     * @param memory Interface used to access state variables.
     * @param tokenizer Tokenizer used to encode/decode strings.
     * @param args Arguments to pass to the function as an array of strings.
     */
    invokeFunction(
        name: string,
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        args: string[]
    ): Promise<any>;
}

/**
 * A function that can be called from a prompt template string.
 * @param context Context for the current turn of conversation.
 * @param memory Interface used to access state variables.
 * @param functions Collection of functions that can be called from a prompt template string.
 * @param tokenizer Tokenizer used to encode/decode strings.
 * @param args Arguments to the function as an array of strings.
 */
export type PromptFunction = (
    context: TurnContext,
    memory: Memory,
    functions: PromptFunctions,
    tokenizer: Tokenizer,
    args: string[]
) => Promise<any>;
