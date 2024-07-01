/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import Chat from 'openai';

/**
 * Interface for the completion configuration portion of a prompt template.
 */
export interface CompletionConfig {
    /**
     * Optional. Type of completion to use. Defaults to using the completion type of the configured default model.
     * @remarks
     * New in schema version 1.1.
     */
    completion_type?: 'chat' | 'text';

    /**
     * The models frequency_penalty as a number between 0 and 1.
     * @remarks
     * Defaults to 0.
     */
    frequency_penalty: number;

    /**
     * If true, the prompt will be augmented with the conversation history.
     * @remarks
     * New in schema version 1.1.
     * Defaults to true.
     */
    include_history: boolean;

    /**
     * If true, the prompt will be augmented with the users input.
     * @remarks
     * New in schema version 1.1.
     * Defaults to true.
     */
    include_input: boolean;

    /**
     * If true, the prompt will be augmented with any images uploaded by the user.
     * @remarks
     * New in schema version 1.1.
     * Defaults to false.
     */
    include_images: boolean;

    /**
     * The maximum number of tokens to generate.
     * @remarks
     * Defaults to 150.
     */
    max_tokens: number;

    /**
     * The maximum number of tokens allowed in the input.
     * @remarks
     * New in schema version 1.1.
     * Defaults to 2048.
     */
    max_input_tokens: number;

    /**
     * Optional. Name of the model to use otherwise the configured default model is used.
     * @remarks
     * New in schema version 1.1.
     */
    model?: string;

    /**
     * The models presence_penalty as a number between 0 and 1.
     * @remarks
     * Defaults to 0.
     */
    presence_penalty: number;

    /**
     * Optional. Array of stop sequences that when hit will stop generation.
     */
    stop_sequences?: string[];

    /**
     * The models temperature as a number between 0 and 2.
     * @remarks
     * Defaults to 0.
     */
    temperature: number;

    /**
     * The models top_p as a number between 0 and 2.
     * @remarks
     * Defaults to 0.
     */
    top_p: number;

    /**
     * Optional. If true, function calling will be enabled with the LLM. Defaults to false.
     */
    include_tools?: boolean;

    /**
     * Optional. Defines the tools function calling behavior. Defaults to 'auto'.
     */
    tool_choice?: Chat.ChatCompletionToolChoiceOption;

    /**
     * Opetional. Enables parallel tools function calling. Defaults to true.
     */
    parallel_tool_calls?: boolean;
}
