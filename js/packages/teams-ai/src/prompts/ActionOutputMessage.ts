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
import { ActionCall } from '../types';

/**
 * A section capable of rendering user input text and images as a user message.
 */
export class ActionOutputMessage extends PromptSectionBase {
    private readonly _historyVariable: string;

    /**
     * Creates a new 'ActionOutputMessage' instance.
     * @param {string} historyVariable Optional. Name of the variable containing the conversation history.
     * @param {number} tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     */
    public constructor(historyVariable = 'temp.history', tokens: number = -1) {
        super(tokens, true, '\n', 'action: ');
        this._historyVariable = historyVariable;
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
        let actionOutputs: Record<string, string> = {};
        let actionCalls: ActionCall[] = [];
        const history: Message[] = memory.getValue(this._historyVariable) ?? [];
        const messages: Message<string>[] = [];

        if (history.length > 1) {
            actionOutputs = memory.getValue('temp.actionOutputs');
            actionCalls = history[history.length - 1].action_calls ?? [];
        }
        for (const actionCall of actionCalls) {
            const message: Message<string> = {
                role: 'tool',
                content: actionOutputs[actionCall.id],
                action_call_id: actionCall.id
            };
            messages.push(message);
        }
        // Return output
        return { output: messages, length: messages.length, tooLong: false };
    }
}
