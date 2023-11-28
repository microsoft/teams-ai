/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, MessageContentParts } from "./Message";
import { PromptFunctions } from "./PromptFunctions";
import { PromptSection, RenderedPromptSection } from "./PromptSection";
import { TurnContext } from 'botbuilder';
import { Tokenizer } from "../tokenizers";
import { Memory } from "../MemoryFork";

/**
 * Abstract Base class for most prompt sections.
 * @remarks
 * This class provides a default implementation of `renderAsText()` so that derived classes only
 * need to implement `renderAsMessages()`.
 */
export abstract class PromptSectionBase implements PromptSection {
    public readonly required: boolean;
    public readonly tokens: number;
    public readonly separator: string;
    public readonly textPrefix: string;

    /**
     * Creates a new 'PromptSectionBase' instance.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param required Optional. Indicates if this section is required. Defaults to `true`.
     * @param separator Optional. Separator to use between sections when rendering as text. Defaults to `\n`.
     * @param textPrefix Optional. Prefix to use for text output. Defaults to `undefined`.
     */
    public constructor(tokens: number = -1, required: boolean = true, separator: string = '\n', textPrefix: string = '') {
        this.required = required;
        this.tokens = tokens;
        this.separator = separator;
        this.textPrefix = textPrefix;
    }

    /**
     * Renders the prompt section as a string of text.
     * @param context Context for the current turn of conversation.
     * @param memory Interface for accessing state variables.
     * @param functions Functions for rendering prompts.
     * @param tokenizer Tokenizer to use for encoding/decoding text.
     * @param maxTokens Maximum number of tokens allowed for the rendered prompt.
     * @returns The rendered prompt section.
     */
    public async renderAsText(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        // Render as messages
        const asMessages = await this.renderAsMessages(context, memory, functions, tokenizer, maxTokens);
        if (asMessages.output.length === 0) {
            return { output: '', length: 0, tooLong: false };
        }

        // Convert to text
        let text = asMessages.output.map((message) => PromptSectionBase.getMessageText(message)).join(this.separator);

        // Calculate length
        const prefixLength = tokenizer.encode(this.textPrefix).length;
        const separatorLength = tokenizer.encode(this.separator).length;
        let length = prefixLength + asMessages.length + ((asMessages.output.length - 1) * separatorLength);

        // Truncate if fixed length
        text = this.textPrefix + text;
        if (this.tokens > 1.0 && length > this.tokens) {
            const encoded = tokenizer.encode(text);
            text = tokenizer.decode(encoded.slice(0, this.tokens));
            length = this.tokens;
        }

        return { output: text, length: length, tooLong: length > maxTokens };
    }

    /**
     * Renders the prompt section as a list of `Message` objects.
     * @remarks
     * MUST be implemented by derived classes.
     * @param context Context for the current turn of conversation.
     * @param memory Interface for accessing state variables.
     * @param functions Functions for rendering prompts.
     * @param tokenizer Tokenizer to use for encoding/decoding text.
     * @param maxTokens Maximum number of tokens allowed for the rendered prompt.
     * @returns The rendered prompt section.
     */
    public abstract renderAsMessages(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message<any>[]>>;

    /**
     * Calculates the token budget for the prompt section.
     * @remarks
     * If the section has a fixed length, the budget will be the minimum of the section's length
     * and the maximum number of tokens. Otherwise, the budget will be the maximum number of tokens.
     * @param maxTokens Maximum number of tokens allowed for the rendered prompt.
     * @returns The token budget for the prompt section.
     */
    protected getTokenBudget(maxTokens: number): number {
        return this.tokens > 1.0 ? Math.min(this.tokens, maxTokens) : maxTokens;
    }

    /**
     * Helper method for returning a list of messages from `renderAsMessages()`.
     * @remarks
     * If the section has a fixed length, the function will truncate the list of messages to
     * fit within the token budget.
     * @param output List of messages to return.
     * @param length Total number of tokens consumed by the list of messages.
     * @param tokenizer Tokenizer to use for encoding/decoding text.
     * @param maxTokens Maximum number of tokens allowed for the rendered prompt.
     * @returns The rendered prompt section.
     */
    protected returnMessages(output: Message[], length: number, tokenizer: Tokenizer, maxTokens: number): RenderedPromptSection<Message[]> {
        // Truncate if fixed length
        if (this.tokens > 1.0) {
            while (length > this.tokens) {
                const msg = output.pop();
                const encoded = tokenizer.encode(PromptSectionBase.getMessageText(msg!));
                length -= encoded.length;
                if (length < this.tokens) {
                    const delta = this.tokens - length;
                    const truncated = tokenizer.decode(encoded.slice(0, delta));
                    output.push({ role: msg!.role, content: truncated });
                    length += delta;
                }
            }
        }

        return { output: output, length: length, tooLong: length > maxTokens };
    }

    /**
     * Returns the content of a message as a string.
     * @param message Message to get the text of.
     * @returns The message content as a string.
     */
    public static getMessageText(message: Message): string {
        let text: MessageContentParts[]|string = message.content ?? '';
        if (Array.isArray(text)) {
            text = text.filter((part) => part.type === 'text').map((part) => part.text).join(' ');
        } else if (message.function_call) {
            text = JSON.stringify(message.function_call);
        } else if (message.name) {
            text = `${message.name} returned ${text}`;
        }

        return text;
    }
}