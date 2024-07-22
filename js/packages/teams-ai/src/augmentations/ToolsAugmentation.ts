/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';

import { Memory } from '../MemoryFork';
import { ChatCompletionAction } from '../models';
import { Plan, PredictedCommand, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { PromptSection } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { ActionCall, PromptResponse, ToolsAugmentationConstants } from '../types';
import { Validation } from '../validators';

import { Augmentation } from './Augmentation';

const { SUBMIT_TOOL_OUTPUTS_VARIABLE, SUBMIT_TOOL_OUTPUTS_MAP, SUBMIT_TOOL_OUTPUTS_MESSAGES, SUBMIT_TOOL_HISTORY } =
    ToolsAugmentationConstants;

/**
 * The 'tools' augmentation is for enabling server-side action/tools calling.
 * In the Teams AI Library, the equivalent to OpenAI's 'tools' functionality is called an 'action'.
 * More information about OpenAI's tools can be found at [OpenAI API docs](https://platform.openai.com/docs/api-reference/chat/create#chat-create-tool_choice).
 *
 * Therefore, tools/actions are defined in `actions.json`, and when 'tools' augmentation is set in `config.json`, the LLM model can specify which action(s) to call.
 * To avoid using server-side tool-calling, do not set augmentation to 'tools' in `config.json`.
 * Server-side tool-calling is not compatible with other augmentation types.
 */
export class ToolsAugmentation implements Augmentation<string | ActionCall[]> {
    private readonly _actions: ChatCompletionAction[];

    public constructor(actions: ChatCompletionAction[]) {
        this._actions = actions ?? [];
    }
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
        const validActionHandlers: ActionCall[] = [];

        if (
            this._actions &&
            response.message &&
            response.message.action_tool_calls &&
            memory.getValue(SUBMIT_TOOL_OUTPUTS_VARIABLE) === true
        ) {
            const actionCall: ActionCall[] = response.message.action_tool_calls!;
            const actions = this._actions;
            // TODO: Just check template.actions and template.config.completion.tool_choice instead?
            const toolChoice = memory.getValue('temp.toolChoice') || 'auto';

            let currentCall: ActionCall | undefined;
            let currentTool: ChatCompletionAction | undefined;
            let functionName: string = '';

            // Validate a single tool where tool_choice is a single action definition
            if (toolChoice instanceof Map) {
                functionName = toolChoice.get('function').get('name');
                currentCall = actionCall[0];

                for (const tool of actions) {
                    if (tool.name === functionName) {
                        currentTool = tool;
                        break;
                    }
                }
            } else {
                // Validate multiple tools
                for (const call of actionCall) {
                    functionName = call.function.name;

                    for (const tool of actions) {
                        if (tool.name === functionName) {
                            currentTool = tool;
                            currentCall = call;
                            break;
                        }
                    }
                    // Validate function name
                    if (!currentTool) {
                        continue;
                    }
                }
            }

            if (!currentTool) {
                return Promise.resolve({
                    type: 'Validation',
                    valid: false,
                    feedback: `ToolsAugmentation: The invoked action ${functionName} does not exist.`
                });
            }

            if (currentTool && currentCall) {
                // Validate required function arguments
                const requiredArgs: string[] =
                    currentTool.parameters &&
                    currentTool.parameters.required &&
                    Array.isArray(currentTool.parameters.required)
                        ? currentTool.parameters.required
                        : [];

                let currentArgs = {};
                try {
                    currentArgs = JSON.parse(currentCall.function.arguments);
                } catch (error) {
                    return Promise.resolve({
                        type: 'Validation',
                        valid: false,
                        feedback: `ToolsAugmentation: Error parsing tool arguments: ${error}`
                    });
                }

                // Validate that required arguments are included in current arguments
                if (
                    requiredArgs &&
                    currentArgs &&
                    requiredArgs.every((arg) => Object.keys(currentArgs).includes(arg))
                ) {
                    validActionHandlers.push(currentCall);
                } else {
                    // There are no required arguments that need validation
                    validActionHandlers.push(currentCall);
                }
            }
            // No tools were valid; reset ToolsAugmentation constants
            if (validActionHandlers.length === 0) {
                memory.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                memory.setValue(SUBMIT_TOOL_OUTPUTS_MAP, {});
                memory.setValue(SUBMIT_TOOL_OUTPUTS_MESSAGES, []);
                memory.setValue(SUBMIT_TOOL_HISTORY, []);
            }
        }

        return Promise.resolve({
            type: 'Validation',
            valid: true,
            value: validActionHandlers.length > 0 ? validActionHandlers : undefined
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
        response: PromptResponse<string | ActionCall[]>
    ): Promise<Plan> {
        const toolsMap = new Map<string, string>();
        const commands: PredictedCommand[] = [];

        if (response.message && response.message.content) {
            if (memory.getValue(SUBMIT_TOOL_OUTPUTS_VARIABLE) === true && Array.isArray(response.message.content)) {
                const actionToolCalls: ActionCall[] = response.message.content;
                for (const actionToolCall of actionToolCalls) {
                    toolsMap.set(actionToolCall.function.name, actionToolCall.id);
                    let parameters;

                    try {
                        parameters = JSON.parse(actionToolCall.function.arguments);
                    } catch (err) {
                        console.error('ToolsAugmentation createPlanFromResponse: Error parsing tool arguments: ', err);
                        parameters = {};
                    }

                    commands.push({
                        type: 'DO',
                        action: actionToolCall.function.name,
                        parameters: parameters
                    } as PredictedDoCommand);
                }
                memory.setValue(SUBMIT_TOOL_OUTPUTS_MAP, toolsMap);
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
        return Promise.resolve({
            type: 'plan',
            commands: []
        });
    }
}
