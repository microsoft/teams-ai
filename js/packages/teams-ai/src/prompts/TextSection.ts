/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message } from "./Message";
import { PromptFunctions } from "./PromptFunctions";
import { RenderedPromptSection } from "./PromptSection";
import { PromptSectionBase } from "./PromptSectionBase";
import { TurnContext } from "botbuilder";
import { Tokenizer } from "../tokenizers";
import { Memory } from "../MemoryFork";

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
     * @param text Text to use for this section.
     * @param role Message role to use for this section.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(text: string, role: string, tokens: number = -1, required: boolean = true, separator: string = '\n', textPrefix?: string) {
        super(tokens, required, separator, textPrefix);
        this.text = text;
        this.role = role;
    }

    /**
     * @private
     */
    public async renderAsMessages(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache length
        if (this._length < 0) {
            this._length = tokenizer.encode(this.text).length;
        }

        // Return output
        const messages: Message<string>[] = this._length > 0 ? [{ role: this.role, content: this.text }] : [];
        return this.returnMessages(messages, this._length, tokenizer, maxTokens);
    }
}