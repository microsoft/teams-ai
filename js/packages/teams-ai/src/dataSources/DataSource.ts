/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { TurnState } from "../TurnState";
import { Tokenizer } from "../tokenizers";
import { RenderedPromptSection } from "../prompts";

/**
 * A data source that can be used to render text that's added to a prompt.
 */
export interface DataSource<TState extends TurnState = TurnState> {
    /**
     * Name of the data source.
     */
    readonly name: string;

    /**
     * Renders the data source as a string of text.
     * @param context Turn context for the current turn of conversation with the user.
     * @param state State for the current turn of conversation with the user.
     * @param tokenizer Tokenizer to use when rendering the data source.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderData(context: TurnContext, state: TState, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>>;
}