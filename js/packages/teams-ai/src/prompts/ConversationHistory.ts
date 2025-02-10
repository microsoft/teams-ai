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
 * A section that renders the conversation history.
 */
export class ConversationHistory extends PromptSectionBase {
    public readonly variable: string;
    public readonly userPrefix: string;
    public readonly assistantPrefix: string;

    /**
     * Creates a new 'ConversationHistory' instance.
     * @param {string} variable - Name of memory variable used to store the histories `Message[]`.
     * @param {number} tokens - Optional. Sizing strategy for this section. Defaults to `proportional` with a value of `1.0`.
     * @param {boolean} required - Optional. Indicates if this section is required. Defaults to `false`.
     * @param {string} userPrefix - Optional. Prefix to use for user messages when rendering as text. Defaults to `user: `.
     * @param {string} assistantPrefix - Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     * @param {string} separator - Optional. Separator to use between messages when rendering as text. Defaults to `\n`.
     */
    public constructor(
        variable: string,
        tokens: number = 1.0,
        required: boolean = false,
        userPrefix: string = 'user: ',
        assistantPrefix: string = 'assistant: ',
        separator: string = '\n'
    ) {
        super(tokens, required, separator);
        this.variable = variable;
        this.userPrefix = userPrefix;
        this.assistantPrefix = assistantPrefix;
    }

    /**
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {PromptFunctions} functions - Prompt functions to use for rendering.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding text.
     * @param {number} maxTokens - Maximum number of tokens allowed.
     * @returns {Promise<RenderedPromptSection<string>>} Rendered prompt section as a string.
     * @private
     */
    public async renderAsText(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<string>> {
        // Get messages from memory
        const history: Message[] = (memory.getValue<Message[]>(this.variable) ?? []).slice();

        // Populate history and stay under the token budget
        let tokens = 0;
        const budget = this.tokens > 1.0 ? Math.min(this.tokens, maxTokens) : maxTokens;
        const separatorLength = tokenizer.encode(this.separator).length;
        const lines: string[] = [];
        for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i];
            const message: Message = { role: msg.role, content: Utilities.toString(tokenizer, msg.content) };
            const prefix = message.role === 'user' ? this.userPrefix : this.assistantPrefix;
            const line = prefix + message.content;
            const length = tokenizer.encode(line).length + (lines.length > 0 ? separatorLength : 0);

            // Add initial line if required
            if (lines.length === 0 && this.required) {
                tokens += length;
                lines.unshift(line);
                continue;
            }

            // Stop if we're over the token budget
            if (tokens + length > budget) {
                break;
            }

            // Add line
            tokens += length;
            lines.unshift(line);
        }

        return { output: lines.join(this.separator), length: tokens, tooLong: tokens > maxTokens };
    }

    /**
     * @private
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - Memory to use for rendering.
     * @param {PromptFunctions} functions - Prompt functions to use for rendering.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding text.
     * @param {number} maxTokens - Maximum number of tokens allowed.
     * @returns {Promise<RenderedPromptSection<Message[]>>} Rendered prompt section as a list of messages.
     */
    public async renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message[]>> {
        // Get messages from memory
        const history: Message[] = (memory.getValue<Message[]>(this.variable) ?? []).slice();

        // Populate messages and stay under the token budget
        let tokens = 0;
        const budget = this.getTokenBudget(maxTokens);
        const messages: Message[] = [];
        for (let i = history.length - 1; i >= 0; i--) {
            // Clone message
            const msg = history[i];
            const message: Message = Object.assign({}, msg);
            if (msg.content !== null) {
                message.content = Utilities.toString(tokenizer, msg.content);
            }

            // Get text message length
            let length = tokenizer.encode(PromptSectionBase.getMessageText(message)).length;

            // Add length of any image parts
            // TODO: This accounts for low detail images but not high detail images.
            if (Array.isArray(message.content)) {
                length += message.content.filter((part) => part.type === 'image').length * 85;
            }

            // Add initial message if required
            if (messages.length === 0 && this.required) {
                tokens += length;
                messages.unshift(message);
                continue;
            }

            // Stop if we're over the token budget
            if (tokens + length > budget) {
                break;
            }

            // Add message
            tokens += length;
            messages.unshift(message);
        }

        // Remove completed partial action outputs
        while (messages.length > 0 && messages[0].role === 'tool') {
            messages.shift();
        }

        return { output: messages, length: tokens, tooLong: tokens > maxTokens };
    }
}
