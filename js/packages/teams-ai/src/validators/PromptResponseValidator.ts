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
import { PromptResponse } from '../types';

/**
 * A validator that can be used to validate prompt responses.
 */
export interface PromptResponseValidator<TValue = any> {
    /**
     * Validates a response to a prompt.
     * @param context Context for the current turn of conversation with the user.
     * @param memory An interface for accessing state values.
     * @param tokenizer Tokenizer to use for encoding and decoding text.
     * @param response Response to validate.
     * @param remaining_attempts Number of remaining attempts to validate the response.
     * @returns A `Validation` object.
     */
    validateResponse(
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse<string>,
        remaining_attempts: number
    ): Promise<Validation<TValue>>;
}

/**
 * Response returned by a `PromptResponseValidator`.
 */
export interface Validation<TValue = any> {
    /**
     * Type of the validation object.
     * @remarks
     * This is used for type checking.
     */
    type: 'Validation';

    /**
     * Whether the validation is valid.
     * @remarks
     * If this is `false` the `feedback` property will be set, otherwise the `value` property
     * MAY be set.
     */
    valid: boolean;

    /**
     * Optional. Repair instructions to send to the model.
     * @remarks
     * Should be set if the validation fails.
     */
    feedback?: string;

    /**
     * Optional. Replacement value to use for the response.
     * @remarks
     * Can be set if the validation succeeds. If set, the value will replace the responses
     * `message.content` property.
     */
    value?: TValue;
}
