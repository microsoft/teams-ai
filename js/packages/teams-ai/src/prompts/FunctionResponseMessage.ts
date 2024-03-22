/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';
import { Utilities } from '../Utilities';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * Message containing the response to a function call.
 */
export class FunctionResponseMessage extends PromptSectionBase {
    private _text: string = '';
    private _length: number = -1;

    public readonly name: string;
    public readonly response: any;

    /**
     * Creates a new 'FunctionResponseMessage' instance.
     * @param {string} name - Name of the function that was called.
     * @param {any} response - The response returned by the called function.
     * @param {number} tokens - Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param {string} functionPrefix - Optional. Prefix to use for function messages when rendering as text. Defaults to `user: ` to simulate the response coming from the user.
     */
    public constructor(name: string, response: any, tokens: number = -1, functionPrefix: string = 'user: ') {
        super(tokens, true, '\n', functionPrefix);
        this.name = name;
        this.response = response;
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
            this._text = Utilities.toString(tokenizer, this.response);
            this._length = tokenizer.encode(this.name).length + tokenizer.encode(this._text).length;
        }

        // Return output
        return this.returnMessages(
            [{ role: 'function', name: this.name, content: this._text }],
            this._length,
            tokenizer,
            maxTokens
        );
    }
}
