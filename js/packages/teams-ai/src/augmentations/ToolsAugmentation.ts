/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { Memory } from '../MemoryFork';
import { Plan, PredictedCommand, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { PromptSection } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { ActionCall, PromptResponse } from '../types';
import { Validation } from '../validators';

import { Augmentation } from './Augmentation';

/**
 * The 'tools' augmentation is for enabling server-side action/tools calling.
 * In the Teams AI Library, the equivalent to OpenAI's 'tools' functionality is called an 'action'.
 * More information about OpenAI's tools can be found at [OpenAI API docs](https://platform.openai.com/docs/api-reference/chat/create#chat-create-tool_choice).
 *
 * Therefore, tools/actions are defined in `actions.json`, and when 'tools' augmentation is set in `config.json`, the LLM model can specify which action(s) to call.
 * To avoid using server-side tool-calling, do not set augmentation to 'tools' in `config.json`.
 * Server-side tool-calling is not compatible with other augmentation types.
 */
export class ToolsAugmentation implements Augmentation<string> {
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
    ): Promise<Validation> {
        return Promise.resolve({
            type: 'Validation',
            valid: true
        });
    }

    /**
     * Creates a plan given validated response value.
     * @param {TurnContext} context Context for the current turn of conversation.
     * @param {Memory} memory An interface for accessing state variables.
     * @param {PromptResponse<string | ActionCall[]>} response The validated and transformed response for the prompt.
     * @returns {Promise<Plan>} The created plan.
     */
    public createPlanFromResponse(
        context: TurnContext,
        memory: Memory,
        response: PromptResponse<string | ActionCall[]>
    ): Promise<Plan> {
        const commands: PredictedCommand[] = [];

        if (response.message && response.message.action_calls) {
            const actionToolCalls: ActionCall[] = response.message.action_calls;

            for (const toolCall of actionToolCalls) {
                let parameters = {};

                if (toolCall.function.arguments && toolCall.function.arguments.trim() !== '') {
                    try {
                        parameters = JSON.parse(toolCall.function.arguments);
                    } catch (err) {
                        console.warn(
                            `ToolsAugmentation: Error parsing tool arguments for ${toolCall.function.name}:`,
                            err
                        );
                        console.warn('Arguments:', toolCall.function.arguments);
                    }
                }

                const doCommand: PredictedDoCommand = {
                    type: 'DO',
                    action: toolCall.function.name,
                    actionId: toolCall.id,
                    parameters: parameters
                };

                commands.push(doCommand);
            }
            return Promise.resolve({ type: 'plan', commands });
        }

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
