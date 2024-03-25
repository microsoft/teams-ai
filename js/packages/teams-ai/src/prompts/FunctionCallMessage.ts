/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, FunctionCall } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * An `assistant` message containing a function to call.
 * @remarks
 * The function call information is returned by the model so we use an "assistant" message to
 * represent it in conversation history.
 */
export class FunctionCallMessage extends PromptSectionBase {
    private _length: number = -1;

    /**
     * Name and arguments of the function to call.
     */
    public readonly function_call: FunctionCall;

    /**
     * Creates a new 'FunctionCallMessage' instance.
     * @param {FunctionCall} function_call name and arguments of the function to call.
     * @param {number} tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param {string} assistantPrefix Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(function_call: FunctionCall, tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(tokens, true, '\n', assistantPrefix);
        this.function_call = function_call;
    }

    /**
     * @private
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {PromptFunctions} functions - Prompt functions to use for rendering.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding text.
     * @param {number} maxTokens - Maximum number of tokens allowed.
     * @returns {Promise<RenderedPromptSection<Message[]>>} Rendered prompt section as a string.
     */
    public async renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache response text and length
        if (this._length < 0) {
            this._length = tokenizer.encode(JSON.stringify(this.function_call)).length;
        }

        // Return output
        return this.returnMessages(
            [{ role: 'assistant', content: undefined, function_call: this.function_call }],
            this._length,
            tokenizer,
            maxTokens
        );
    }
}
