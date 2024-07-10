/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { PromptResponseValidator } from '../validators';
import { Plan } from '../planners';
import { PromptSection } from '../prompts';
import { Memory } from '../MemoryFork';
import { PromptResponse } from '../types';

/**
 * An augmentation is a component that can be added to a prompt template to add additional
 * functionality to the prompt.
 * @template TContent Optional. Type of message content returned for a 'success' response. The `response.message.content` field will be of type TContent. Defaults to `any`.
 */
export interface Augmentation<TContent = any> extends PromptResponseValidator<TContent> {
    /**
     * Creates an optional prompt section for the augmentation.
     */
    createPromptSection(): PromptSection | undefined;

    /**
     * Creates a plan given validated response value.
     * @param context Context for the current turn of conversation.
     * @param memory An interface for accessing state variables.
     * @param response The validated and transformed response for the prompt.
     * @returns The created plan.
     */
    createPlanFromResponse(context: TurnContext, memory: Memory, response: PromptResponse<TContent>): Promise<Plan>;
}
