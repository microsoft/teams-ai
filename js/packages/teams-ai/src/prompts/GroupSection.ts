/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection, PromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';
import { LayoutEngine } from './LayoutEngine';
import { TurnContext } from 'botbuilder';
import { Tokenizer } from '../tokenizers';
import { Memory } from '../MemoryFork';

/**
 * A group of sections that will rendered as a single message.
 */
export class GroupSection extends PromptSectionBase {
    private readonly _layoutEngine: LayoutEngine;

    public readonly sections: PromptSection[];
    public readonly role: string;

    /**
     *
     * @param {PromptSection[]} sections - List of sections to group together.
     * @param {string} role - Optional. Message role to use for this section. Defaults to `system`.
     * @param {number} tokens - Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param {boolean} required - Optional. Indicates if this section is required. Defaults to `true`.
     * @param {string} separator - Optional. Separator to use between sections when rendering as text. Defaults to `\n\n`.
     * @param {string} textPrefix - Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(
        sections: PromptSection[],
        role: string = 'system',
        tokens: number = -1,
        required: boolean = true,
        separator: string = '\n\n',
        textPrefix?: string
    ) {
        super(tokens, required, separator, textPrefix);
        this._layoutEngine = new LayoutEngine(sections, tokens, required, separator);
        this.sections = sections;
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
        // Render sections to text
        const { output, length } = await this._layoutEngine.renderAsText(
            context,
            memory,
            functions,
            tokenizer,
            maxTokens
        );

        // Return output as a single message
        return this.returnMessages([{ role: this.role, content: output }], length, tokenizer, maxTokens);
    }
}
