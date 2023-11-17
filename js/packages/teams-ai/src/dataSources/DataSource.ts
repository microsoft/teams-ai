/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder";
import { Tokenizer } from "../tokenizers";
import { RenderedPromptSection } from "../prompts";
import { Memory } from "../MemoryFork";

/**
 * A data source that can be used to render text that's added to a prompt.
 */
export interface DataSource {
    /**
     * Name of the data source.
     */
    readonly name: string;

    /**
     * Renders the data source as a string of text.
     * @param context Turn context for the current turn of conversation with the user.
     * @param memory An interface for accessing state values.
     * @param tokenizer Tokenizer to use when rendering the data source.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     * @returns The text to inject into the prompt as a `RenderedPromptSection` object.
     */
    renderData(context: TurnContext, memory: Memory, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>>;
}