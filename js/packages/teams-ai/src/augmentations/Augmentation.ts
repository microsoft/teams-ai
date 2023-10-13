/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from "botbuilder-core";
import { TurnState } from "../TurnState";
import { PromptResponseValidator, Validation } from "../validators";
import { Plan } from "../planners";
import { PromptSection } from "../prompts";

export interface Augmentation<TState extends TurnState = TurnState, TValue = any> extends PromptResponseValidator<TState, TValue> {
    /**
     * Creates an optional prompt section for the augmentation.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     */
    createPromptSection(
        context: TurnContext,
        state: TState,
    ): Promise<PromptSection|undefined>;

    /**
     * Creates a plan given validated response value.
     * @param context Context for the current turn of conversation.
     * @param state Application state for the current turn of conversation.
     * @param validation The validation that was performed.
     * @returns The created plan.
     */
    createPlanFromResponse(
        context: TurnContext,
        state: TState,
        validation: Validation<TValue>,
    ): Promise<Plan>;

}