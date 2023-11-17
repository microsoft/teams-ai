/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Message, FunctionCall } from "./Message";
import { PromptFunctions } from "./PromptFunctions";
import { RenderedPromptSection } from "./PromptSection";
import { PromptSectionBase } from "./PromptSectionBase";
import { TurnContext } from "botbuilder";
import { Tokenizer } from "../tokenizers";
import { Memory } from "../MemoryFork";

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
     * @param function_call name and arguments of the function to call.
     * @param tokens Optional. Sizing strategy for this section. Defaults to `auto`.
     * @param assistantPrefix Optional. Prefix to use for assistant messages when rendering as text. Defaults to `assistant: `.
     */
    public constructor(function_call: FunctionCall, tokens: number = -1, assistantPrefix: string = 'assistant: ') {
        super(tokens, true, '\n', assistantPrefix);
        this.function_call = function_call;
    }

    /**
     * @private
     */
    public async renderAsMessages(context: TurnContext, memory: Memory, functions: PromptFunctions, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>> {
        // Calculate and cache response text and length
        if (this._length < 0) {
            this._length = tokenizer.encode(JSON.stringify(this.function_call)).length;
        }

        // Return output
        return this.returnMessages([{ role: 'assistant', content: undefined, function_call: this.function_call }], this._length, tokenizer, maxTokens);
    }
}