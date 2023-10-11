/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { TurnState, DefaultConversationState, DefaultUserState, DefaultTempState } from "../TurnState";
import { RenderedPromptSection } from "../prompts";
import { Tokenizer } from "../tokenizers";
import { DataSource } from "./DataSource";

export class TextDataSource implements DataSource {
    private readonly _name: string;
    private readonly _text: string;
    private _tokens?: number[];

    public constructor(name: string, text: string) {
        this._name = name;
        this._text = text;
    }

    public get name(): string {
        return this._name;
    }

    public renderData(context: TurnContext, state: TurnState<DefaultConversationState, DefaultUserState, DefaultTempState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
        // Tokenize text on first use
        if (!this._tokens) {
            this._tokens = tokenizer.encode(this._text);
        }

        // Check for max tokens
        if (this._tokens.length > maxTokens) {
            const trimmed = this._tokens.slice(0, maxTokens);
            return Promise.resolve({ output: tokenizer.decode(trimmed), length: trimmed.length, tooLong: true });
        } else {
            return Promise.resolve({ output: this._text, length: this._tokens.length, tooLong: false });
        }
    }
}