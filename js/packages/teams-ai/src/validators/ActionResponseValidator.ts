import { TurnContext } from 'botbuilder';

import { Memory } from '../MemoryFork';
import { ChatCompletionAction } from '../models';
import { Message } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { PromptResponse } from '../types';

import { JSONResponseValidator } from './JSONResponseValidator';
import { PromptResponseValidator, Validation } from './PromptResponseValidator';

/**
 * A validated action call.
 */
export interface ValidatedChatCompletionAction {
    /**
     * Name of the action to call.
     */
    name: string;

    /**
     * Arguments to pass to the action.
     */
    parameters: Record<string, any>;
}

/**
 * Validates action calls returned by the model.
 */
export class ActionResponseValidator implements PromptResponseValidator<ValidatedChatCompletionAction> {
    private readonly _actions: Map<string, ChatCompletionAction> = new Map();
    private readonly _isRequired: boolean;
    private readonly _noun: string;
    private readonly _Noun: string;

    /**
     * Creates a new `ActionResponseValidator` instance.
     * @param {ChatCompletionAction[]} actions List of supported actions.
     * @param {boolean} isRequired Whether the response is required to call an action.
     * @param {string} noun Optional. Name of the action to use in feedback messages. Defaults to `action`.
     * @param {string} Noun Optional. Name of the action to use in feedback messages. Defaults to `Action`.
     */
    public constructor(
        actions: ChatCompletionAction[],
        isRequired: boolean,
        noun: string = 'action',
        Noun: string = 'Action'
    ) {
        for (const action of actions) {
            this._actions.set(action.name, action);
        }
        this._isRequired = isRequired;
        this._noun = noun;
        this._Noun = Noun;
    }

    /**
     * Gets a list of the actions configured for the validator.
     * @returns {ChatCompletionAction[]} A list of the actions configured for the validator.
     */
    public get actions(): ChatCompletionAction[] {
        const list: ChatCompletionAction[] = [];
        this._actions.forEach((fn) => list.push(fn));
        return list;
    }

    /**
     * Validates a response to a prompt.
     * @param {TurnContext} context Context for the current turn of conversation with the user.
     * @param {Memory} memory An interface for accessing state values.
     * @param {Tokenizer} tokenizer Tokenizer to use for encoding and decoding text.
     * @param {PromptResponse} response Response to validate.
     * @param {number} remaining_attempts Number of remaining attempts to validate the response.
     * @returns {Promise<Validation<ValidatedChatCompletionAction>>} A `Validation` object.
     */
    public async validateResponse(
        context: TurnContext,
        memory: Memory,
        tokenizer: Tokenizer,
        response: PromptResponse<string>,
        remaining_attempts: number
    ): Promise<Validation<ValidatedChatCompletionAction>> {
        if (typeof response.message == 'object' && response.message.function_call) {
            // Ensure name is specified
            const function_call = response.message.function_call;
            if (!function_call.name) {
                return {
                    type: 'Validation',
                    valid: false,
                    feedback: `${this._Noun} name missing. Specify a valid ${this._noun} name.`
                };
            }

            // Ensure name valid
            if (!this._actions.has(function_call.name)) {
                return {
                    type: 'Validation',
                    valid: false,
                    feedback: `Unknown ${this._noun} named "${function_call.name}". Specify a valid ${this._noun} name.`
                };
            }

            // Validate arguments
            let parameters: Record<string, any> = {};
            const action = this._actions.get(function_call.name)!;
            if (action.parameters) {
                const validator = new JSONResponseValidator(
                    action.parameters,
                    `No arguments were sent with called ${this._noun}. Call the "${function_call.name}" ${this._noun} with required arguments as a valid JSON object.`,
                    `The ${this._noun} arguments had errors. Apply these fixes and call "${function_call.name}" ${this._noun} again:`
                );
                const args = function_call.arguments === '{}' ? undefined : function_call.arguments ?? '{}';
                const message: Message = { role: 'assistant', content: args };
                const result = await validator.validateResponse(
                    context,
                    memory,
                    tokenizer,
                    { status: 'success', message },
                    remaining_attempts
                );
                if (!result.valid) {
                    return result as Validation<ValidatedChatCompletionAction>;
                } else {
                    parameters = result.value!;
                }
            }

            // Return the validated action
            return {
                type: 'Validation',
                valid: true,
                value: {
                    name: function_call.name,
                    parameters: parameters
                }
            };
        } else if (this._isRequired) {
            return {
                type: 'Validation',
                valid: false,
                feedback: `No ${this._noun} was specified. Call a ${this._noun} with valid arguments.`
            };
        }

        // No action was called
        return {
            type: 'Validation',
            valid: true
        };
    }
}
