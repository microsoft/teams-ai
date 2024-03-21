/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { ChatCompletionAction, PromptResponse } from '../models';
import { Plan, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { Tokenizer } from '../tokenizers';
import { ActionResponseValidator, JSONResponseValidator, Validation } from '../validators';
import { Augmentation } from './Augmentation';
import { Message, PromptSection } from '../prompts';
import { Memory } from '../MemoryFork';
import { ActionAugmentationSection } from './ActionAugmentationSection';
import { Schema } from 'jsonschema';

/**
 * JSON schema for a `Plan`.
 */
export const PlanSchema: Schema = {
    type: 'object',
    properties: {
        type: {
            type: 'string',
            enum: ['plan']
        },
        commands: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['DO', 'SAY']
                    },
                    action: {
                        type: 'string'
                    },
                    parameters: {
                        type: 'object'
                    },
                    response: {
                        type: 'string'
                    }
                },
                required: ['type']
            },
            minItems: 1
        }
    },
    required: ['type', 'commands']
};

/**
 * The 'sequence' augmentation.
 * @remarks
 * This augmentation allows the model to return a sequence of actions to perform.
 */
export class SequenceAugmentation implements Augmentation<Plan | undefined> {
    private readonly _section: ActionAugmentationSection;
    private readonly _planValidator: JSONResponseValidator<Plan> = new JSONResponseValidator(
        PlanSchema,
        `Return a JSON object that uses the SAY command to say what you're thinking.`
    );
    private readonly _actionValidator: ActionResponseValidator;

    public constructor(actions: ChatCompletionAction[]) {
        this._section = new ActionAugmentationSection(
            actions,
            [
                `Use the actions above to create a plan in the following JSON format:`,
                `{"type":"plan","commands":[{"type":"DO","action":"<name>","parameters":{"<name>":<value>}},{"type":"SAY","response":"<response>"}]}`
            ].join('\n')
        );
        this._actionValidator = new ActionResponseValidator(actions, true);
    }

    /**
     * Creates an optional prompt section for the augmentation.
     * @returns {PromptSection | undefined} The new PromptSection or undefined.
     */
    public createPromptSection(): PromptSection | undefined {
        return this._section;
    }

    /**
     * Validates a response to a prompt.
     * @param {TurnContext} context - Context for the current turn of conversation with the user.
     * @param {Memory} memory - An interface for accessing state values.
     * @param {Tokenizer} tokenizer - Tokenizer to use for encoding and decoding text.
     * @param {PromptResponse<string>} response - Response to validate.
     * @param {number} remaining_attempts - Number of remaining attempts to validate the response.
     * @returns {Validation} A `Validation` object.
     */
    public async validateResponse(
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse<string>,
        remaining_attempts: number
    ): Promise<Validation<Plan | undefined>> {
        // Validate that we got a well-formed plan
        const validationResult = await this._planValidator.validateResponse(
            context,
            memory,
            tokenizer,
            response,
            remaining_attempts
        );
        if (!validationResult.valid) {
            return validationResult;
        }

        // Validate that the plan is structurally correct
        const plan = validationResult.value as Plan;
        for (let i = 0; i < plan.commands.length; i++) {
            const command = plan.commands[i];
            if (command.type === 'DO') {
                // Ensure that the model specified an action
                const doCommand = command as PredictedDoCommand;
                const action = doCommand.action;
                if (!action) {
                    return {
                        type: 'Validation',
                        valid: false,
                        feedback: `The plan JSON is missing the DO "action" for command[${i}]. Return the name of the action to DO.`
                    };
                }

                // Ensure that the action is valid
                const parameters = JSON.stringify(doCommand.parameters ?? {});
                const message: Message = {
                    role: 'assistant',
                    content: undefined,
                    function_call: { name: doCommand.action, arguments: parameters }
                };
                const actionValidation = await this._actionValidator.validateResponse(
                    context,
                    memory,
                    tokenizer,
                    { status: 'success', message },
                    remaining_attempts
                );
                if (!actionValidation.valid) {
                    return actionValidation as any;
                }
            } else if (command.type === 'SAY') {
                // Ensure that the model specified a response
                const sayCommand = command as PredictedSayCommand;
                const response = sayCommand.response;
                if (!response) {
                    return {
                        type: 'Validation',
                        valid: false,
                        feedback: `The plan JSON is missing the SAY "response" for command[${i}]. Return the response to SAY.`
                    };
                }
            } else {
                return {
                    type: 'Validation',
                    valid: false,
                    feedback: `The plan JSON contains an unknown command type of ${command.type}. Only use DO or SAY commands.`
                };
            }
        }

        // Return the validated monologue
        return validationResult;
    }

    /**
     * Creates a plan given validated response value.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - An interface for accessing state variables.
     * @param {PromptResponse<Plan|undefined>} response - The validated and transformed response for the prompt.
     * @returns {Promise<Plan>} The created plan.
     */
    public createPlanFromResponse(
        context: TurnContext,
        memory: Memory,
        response: PromptResponse<Plan | undefined>
    ): Promise<Plan> {
        return Promise.resolve(response.message!.content!);
    }
}
