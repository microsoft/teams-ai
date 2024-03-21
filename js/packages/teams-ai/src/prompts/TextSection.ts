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
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * A section of text that will be rendered as a message.
 */
export class TextSection extends PromptSectionBase {
    private _length: number = -1;

    /**
     * Text to use for this section.
     */
    public readonly text: string;

    /**
     * Message role to use for this section.
     */
    public readonly role: string;

    /**
     * Creates a new 'TextSection' instance.
     * @param {string} text - Text to use for this section.
     * @param {string} role - Message role to use for this section.
     * @param {number} tokens - Optional. Sizing strategy for this section. Defaults to -1, `auto`.
     * @param {boolean} required - Optional. Indicates if this section is required. Defaults to `true`.
     * @param {string} separator - Optional. Separator to use between sections when rendering as text. Defaults to `\n`.
     * @param {string} textPrefix - Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(
        text: string,
        role: string,
        tokens: number = -1,
        required: boolean = true,
        separator: string = '\n',
        textPrefix?: string
    ) {
        super(tokens, required, separator, textPrefix);
        this.text = text;
        this.role = role;
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
        // Calculate and cache length
        if (this._length < 0) {
            this._length = tokenizer.encode(this.text).length;
        }

        // Return output
        const messages: Message<string>[] = this._length > 0 ? [{ role: this.role, content: this.text }] : [];
        return this.returnMessages(messages, this._length, tokenizer, maxTokens);
    }
}
