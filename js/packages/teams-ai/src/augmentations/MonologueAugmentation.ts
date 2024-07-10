/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { Schema } from 'jsonschema';

import { Memory } from '../MemoryFork';
import { ChatCompletionAction } from '../models';
import { Message, PromptSection } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { PromptResponse } from '../types';
import { Plan, PredictedCommand, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { ActionResponseValidator, JSONResponseValidator, Validation } from '../validators';

import { Augmentation } from './Augmentation';
import { ActionAugmentationSection } from './ActionAugmentationSection';

/**
 * @private
 */
const MISSING_ACTION_FEEDBACK = `The JSON returned had errors. Apply these fixes:\nadd the "action" property to "instance"`;

/**
 * @private
 */
const SAY_REDIRECT_FEEDBACK = `The JSON returned was missing an action. Return a valid JSON object that contains your thoughts and uses the SAY action.`;

/**
 * Structure used to track the inner monologue of an LLM.
 */
export interface InnerMonologue {
    /**
     * The LLM's thoughts.
     */
    thoughts: {
        /**
         * The LLM's current thought.
         */
        thought: string;

        /**
         * The LLM's reasoning for the current thought.
         */
        reasoning: string;

        /**
         * The LLM's plan for the future.
         */
        plan: string;
    };

    /**
     * The next action to perform.
     */
    action: {
        /**
         * Name of the action to perform.
         */
        name: string;

        /**
         * Optional. Parameters for the action.
         */
        parameters?: Record<string, any>;
    };
}

/**
 * JSON schema for validating an `InnerMonologue`.
 */
export const InnerMonologueSchema: Schema = {
    type: 'object',
    properties: {
        thoughts: {
            type: 'object',
            properties: {
                thought: { type: 'string' },
                reasoning: { type: 'string' },
                plan: { type: 'string' }
            },
            required: ['thought', 'reasoning', 'plan']
        },
        action: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                parameters: { type: 'object' }
            },
            required: ['name']
        }
    },
    required: ['thoughts', 'action']
};

/**
 * The 'monologue' augmentation.
 * @remarks
 * This augmentation adds support for an inner monologue to the prompt. The monologue helps the LLM
 * to perform chain-of-thought reasoning across multiple turns of conversation.
 */
export class MonologueAugmentation implements Augmentation<InnerMonologue | undefined> {
    private readonly _section: ActionAugmentationSection;
    private readonly _monologueValidator: JSONResponseValidator<InnerMonologue> = new JSONResponseValidator(
        InnerMonologueSchema,
        `No valid JSON objects were found in the response. Return a valid JSON object with your thoughts and the next action to perform.`
    );
    private readonly _actionValidator: ActionResponseValidator;

    /**
     * Creates a new `MonologueAugmentation` instance.
     * @param {ChatCompletionAction[]} actions - List of actions supported by the prompt.
     */
    public constructor(actions: ChatCompletionAction[]) {
        actions = appendSAYAction(actions);
        this._section = new ActionAugmentationSection(
            actions,
            [
                `Return a JSON object with your thoughts and the next action to perform.`,
                `Only respond with the JSON format below and base your plan on the actions above.`,
                `If you're not sure what to do, you can always say something by returning a SAY action.`,
                `If you're told your JSON response has errors, do your best to fix them.`,
                `Response Format:`,
                `{"thoughts":{"thought":"<your current thought>","reasoning":"<self reflect on why you made this decision>","plan":"- short bulleted\\n- list that conveys\\n- long-term plan"},"action":{"name":"<action name>","parameters":{"<name>":"<value>"}}}`
            ].join('\n')
        );
        this._actionValidator = new ActionResponseValidator(actions, true);
    }

    /**
     * @returns {PromptSection|undefined} Returns an optional prompt section for the augmentation.
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
    ): Promise<Validation<InnerMonologue | undefined>> {
        // Validate that we got a well-formed inner monologue
        const validationResult = await this._monologueValidator.validateResponse(
            context,
            memory,
            tokenizer,
            response,
            remaining_attempts
        );
        if (!validationResult.valid) {
            // Catch the case where the action is missing.
            // - GPT-3.5 gets stuck in a loop here sometimes so we'll redirect it to just use the SAY action.
            if (validationResult.feedback == MISSING_ACTION_FEEDBACK) {
                validationResult.feedback = SAY_REDIRECT_FEEDBACK;
            }
            return validationResult;
        }

        // Validate that the action exists and its parameters are valid
        const monologue = validationResult.value as InnerMonologue;
        const parameters = JSON.stringify(monologue.action.parameters ?? {});
        const message: Message = {
            role: 'assistant',
            content: undefined,
            function_call: { name: monologue.action.name, arguments: parameters }
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

        // Return the validated monologue
        return validationResult;
    }

    /**
     * Creates a plan given validated response value.
     * @param {TurnContext} context - Context for the current turn of conversation.
     * @param {Memory} memory - An interface for accessing state variables.
     * @param {PromptResponse<InnerMonologue|undefined>} response - The validated and transformed response for the prompt.
     * @returns {Plan} The created plan.
     */
    public createPlanFromResponse(
        context: TurnContext,
        memory: Memory,
        response: PromptResponse<InnerMonologue | undefined>
    ): Promise<Plan> {
        // Identify the action to perform
        let command: PredictedCommand;
        const monologue = response.message!.content as InnerMonologue;
        if (monologue.action.name == 'SAY') {
            command = {
                type: 'SAY',
                response: {
                    ...response.message,
                    content: monologue.action.parameters?.text || ''
                }
            } as PredictedSayCommand;
        } else {
            command = {
                type: 'DO',
                action: monologue.action.name,
                parameters: monologue.action.parameters ?? {}
            } as PredictedDoCommand;
        }
        return Promise.resolve({ type: 'plan', commands: [command] });
    }
}

/**
 * @private
 * @param {ChatCompletionAction[]} actions - List of actions
 * @returns {ChatCompletionAction[]} The modified list of actions.
 */
function appendSAYAction(actions: ChatCompletionAction[]): ChatCompletionAction[] {
    const clone = actions.slice();
    clone.push({
        name: 'SAY',
        description: 'use to ask the user a question or say something',
        parameters: {
            type: 'object',
            properties: {
                text: {
                    type: 'string',
                    description: 'text to say or question to ask'
                }
            },
            required: ['text']
        }
    });
    return clone;
}
