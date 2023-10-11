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
import { PromptResponse } from "../models";
import { Validation, PromptResponseValidator } from "./PromptResponseValidator";

/**
 * Default response validator that always returns true.
 */
export class DefaultResponseValidator<TState extends TurnState = TurnState> implements PromptResponseValidator<TState> {
    /**
     * Validates a response to a prompt.
     * @param context Context for the current turn of conversation with the user.
     * @param state State for the current turn of conversation with the user.
     * @param tokenizer Tokenizer to use for encoding and decoding text.
     * @param response Response to validate.
     * @param remaining_attempts Number of remaining attempts to validate the response.
     * @returns A `Validation` object.
     */
    public validateResponse(context: TurnContext, state: TState, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<string>> {
        return Promise.resolve({
            type: 'Validation',
            valid: true,
            value: typeof response.message == 'object' ? response.message.content! : response.message
        });
    }
}