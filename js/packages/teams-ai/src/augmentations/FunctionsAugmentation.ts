/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { ChatCompletionAction, PromptResponse } from "../models";
import { Plan, PredictedSayCommand } from "../planners";
import { Tokenizer } from "../tokenizers";
import { Validation } from "../validators";
import { Augmentation } from "./Augmentation";
import { PromptSection } from "../prompts";
import { Memory } from "../MemoryFork";

/**
 * @private
 */
export class FunctionsAugmentation implements Augmentation<string> {
    /**
     * Creates a new `FunctionsAugmentation` instance.
     * @param actions List of actions supported by the prompt.
     */
    public constructor(actions: ChatCompletionAction[]) {
    }

    /**
     * Creates an optional prompt section for the augmentation.
     */
    public createPromptSection(): PromptSection|undefined {
        return undefined;
    }

    /**
     * Validates a response to a prompt.
     * @param context Context for the current turn of conversation with the user.
     * @param memory An interface for accessing state values.
     * @param tokenizer Tokenizer to use for encoding and decoding text.
     * @param response Response to validate.
     * @param remaining_attempts Number of remaining attempts to validate the response.
     * @returns A `Validation` object.
     */
    public validateResponse(context: TurnContext, memory: Memory, tokenizer: Tokenizer, response: PromptResponse<string>, remaining_attempts: number): Promise<Validation<string>> {
        return Promise.resolve({
            type: 'Validation',
            valid: true,
        });
    }

    /**
     * Creates a plan given validated response value.
     * @param context Context for the current turn of conversation.
     * @param memory An interface for accessing state variables.
     * @param response The validated and transformed response for the prompt.
     * @returns The created plan.
     */
    public createPlanFromResponse(context: TurnContext, memory: Memory, response: PromptResponse<string>): Promise<Plan> {
        return Promise.resolve({
            type: 'plan',
            commands: [
                {
                    type: 'SAY',
                    response: response.message!.content ?? ''
                } as PredictedSayCommand
            ]
        });
    }
}
