/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';

import { Memory } from '../MemoryFork';
import { Tokenizer } from '../tokenizers';
import { Message } from './Message';
import { PromptFunctions } from './PromptFunctions';
import { RenderedPromptSection } from './PromptSection';
import { PromptSectionBase } from './PromptSectionBase';

/**
 * A section capable of rendering user input text and images as a user message.
 */
export class ActionOutputMessage extends PromptSectionBase {
    private readonly _inputVariable: string;

    /**
     * Creates a new 'ActionOutputMessage' instance.
     * @param {number} tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param {string} inputVariable Optional. Name of the variable containing the user input text. Defaults to `input`.
     */
    public constructor(tokens: number = -1, inputVariable = 'actionOutputs') {
        super(tokens, true, '\n', 'action: ');
        this._inputVariable = inputVariable;
    }

    /**
     * @private
     * @param {TurnContext} context Turn context for the message to be rendered.
     * @param {Memory} memory Memory in storage.
     * @param {PromptFunctions} functions Prompt functions.
     * @param {Tokenizer} tokenizer Tokenizer.
     * @param {number} maxTokens Max tokens to be used for rendering.
     * @returns {Promise<RenderedPromptSection<Message<any>[]>>} Rendered prompt section.
     */
    public async renderAsMessages(
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        maxTokens: number
    ): Promise<RenderedPromptSection<Message<any>[]>> {
        const actionOutputs: Record<string, string> = memory.getValue(this._inputVariable) || {};
        const messages: Message<string>[] = [];

        for (const action in actionOutputs) {
            const message: Message<string> = {
                role: 'tool',
                content: actionOutputs[action],
                action_call_id: action
            };
            messages.push(message);
        }
        // Return output
        return { output: messages, length: messages.length, tooLong: false };
    }
}
