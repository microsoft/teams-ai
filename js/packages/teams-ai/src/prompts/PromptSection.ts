/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder';
import { TurnState } from '../TurnState';
import { Tokenizer } from '../tokenizers';
import { PromptFunctions } from './PromptFunctions';
import { Message } from './Message';

export interface PromptSection<TState extends TurnState = TurnState> {
    /**
     * If true the section is mandatory otherwise it can be safely dropped.
     */
    readonly required: boolean;

    /**
     * The requested token budget for this section.
     * - Values between 0.0 and 1.0 represent a percentage of the total budget and the section will be layed out proportionally to all other sections.
     * - Values greater than 1.0 represent the max number of tokens the section should be allowed to consume.
     */
    readonly tokens: number;

    /**
     * Renders the section as a string of text.
     * @param context Context for the current turn of conversation with the user.
     * @param state Current turn state.
     * @param functions Registry of functions that can be used by the section.
     * @param tokenizer Tokenizer to use when rendering the section.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderAsText(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<string>>;

    /**
     * Renders the section as a list of messages.
     * @param context Context for the current turn of conversation with the user.
     * @param state Current turn state.
     * @param functions Registry of functions that can be used by the section.
     * @param tokenizer Tokenizer to use when rendering the section.
     * @param maxTokens Maximum number of tokens allowed to be rendered.
     */
    renderAsMessages(context: TurnContext, state: TState, functions: PromptFunctions<TState>, tokenizer: Tokenizer, maxTokens: number): Promise<RenderedPromptSection<Message[]>>;
}

export interface RenderedPromptSection<T> {
    /**
     * The section that was rendered.
     */
    output: T;

    /**
     * The number of tokens that were rendered.
     */
    length: number;

    /**
     * If true the section was truncated because it exceeded the maxTokens budget.
     */
    tooLong: boolean;
}
