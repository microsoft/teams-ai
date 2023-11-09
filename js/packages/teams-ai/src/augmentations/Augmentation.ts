/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { PromptResponseValidator } from "../validators";
import { Plan } from "../planners";
import { PromptSection } from "../prompts";
import { Memory } from "../MemoryFork";
import { PromptResponse } from "../models";

export interface Augmentation<TValue = any> extends PromptResponseValidator<TValue> {
    /**
     * Creates an optional prompt section for the augmentation.
     */
    createPromptSection(): PromptSection|undefined;

    /**
     * Creates a plan given validated response value.
     * @param context Context for the current turn of conversation.
     * @param memory An interface for accessing state variables.
     * @param response The validated and transformed response for the prompt.
     * @returns The created plan.
     */
    createPlanFromResponse(
        context: TurnContext,
        memory: Memory,
        response: PromptResponse<TValue>
    ): Promise<Plan>;

}