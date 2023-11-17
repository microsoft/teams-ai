/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { RenderedPromptSection } from "../prompts";
import { Tokenizer } from "../tokenizers";
import { DataSource } from "./DataSource";
import { Memory } from "../MemoryFork";

/**
 * A data source that can be used to add a static block of text to a prompt.
 * @remarks
 * Primarily used for testing but could be used to inject some externally define text into a
 * prompt. The text will be truncated to fit within the `maxTokens` limit.
 */
export class TextDataSource implements DataSource {
    private readonly _name: string;
    private readonly _text: string;
    private _tokens?: number[];

    /**
     * Creates a new `TextDataSource` instance.
     * @param name Name of the data source.
     * @param text Text to inject into the prompt.
     */
    public constructor(name: string, text: string) {
        this._name = name;
        this._text = text;
    }

    /**
     * Name of the data source.
     */
    public get name(): string {
        return this._name;
    }

    /**
     * Renders the data source as a string of text.
     * @param context Turn context for the current turn of conversation with the user.
     * @param memory An interface for accessing state values.
     * @param tokenizer Tokenizer to use when rendering the data source.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     * @returns The text to inject into the prompt as a `RenderedPromptSection` object.
     */
    public renderData(context: TurnContext, memory: Memory, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>> {
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