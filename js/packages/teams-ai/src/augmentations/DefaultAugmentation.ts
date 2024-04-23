/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { PromptResponse } from '../models';
import { Plan, PredictedSayCommand } from '../planners';
import { Tokenizer } from '../tokenizers';
import { Validation } from '../validators';
import { Augmentation } from './Augmentation';
import { PromptSection } from '../prompts';
import { Memory } from '../MemoryFork';

/**
 * The default 'none' augmentation.
 * @remarks
 * This augmentation does not add any additional functionality to the prompt. It always
 * returns a `Plan` with a single `SAY` command containing the models response.
 */
export class DefaultAugmentation implements Augmentation<string> {
    /**
     * @returns {PromptSection|undefined} Returns an optional prompt section for the augmentation.
     */
    public createPromptSection(): PromptSection | undefined {
        return undefined;
    }

    /**
     * Validates a response to a prompt.
     * @param {TurnContext} context - Context for the current turn of conversation with the user.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding and decoding text.
     * @param {PromptResponse<string>} response - Response to validate.
     * @param {number} remaining_attempts Number of remaining attempts to validate the response.
     * @returns {Validation} A `Validation` object.
     */
    public validateResponse(
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse<string>,
        remaining_attempts: number
    ): Promise<Validation<string>> {
        return Promise.resolve({
            type: 'Validation',
            valid: true
        });
    }

    /**
     * Creates a plan given validated response value.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {Memory} memory An interface for accessing state variables.
     * @param {PromptResponse<string>} response The validated and transformed response for the prompt.
     * @returns {Promise<Plan>} The created plan.
     */
    public createPlanFromResponse(
        context: TurnContext,
        memory: Memory,
        response: PromptResponse<string>
    ): Promise<Plan> {
        return Promise.resolve({
            type: 'plan',
            commands: [
                {
                    type: 'SAY',
                    response: response.message
                } as PredictedSayCommand
            ]
        });
    }
}
