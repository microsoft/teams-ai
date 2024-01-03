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
     * @param sections List of sections to group together.
     * @param role Optional. Message role to use for this section. Defaults to `system`.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
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
     * @param context
     * @param memory
     * @param functions
     * @param tokenizer
     * @param maxTokens
     * @private
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
