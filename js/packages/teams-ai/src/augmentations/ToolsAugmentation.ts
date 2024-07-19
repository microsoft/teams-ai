/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TurnContext } from 'botbuilder-core';
import { ChatCompletionMessageToolCall } from 'openai/resources';

import { Memory } from '../MemoryFork';
import { ChatCompletionAction } from '../models';
import { Plan, PredictedCommand, PredictedDoCommand, PredictedSayCommand } from '../planners';
import { PromptSection } from '../prompts';
import { Tokenizer } from '../tokenizers';
import { PromptResponse, ToolsAugmentationConstants } from '../types';
import { Validation } from '../validators';

import { Augmentation } from './Augmentation';

const { SUBMIT_TOOL_OUTPUTS_VARIABLE, SUBMIT_TOOL_OUTPUTS_MAP, SUBMIT_TOOL_OUTPUTS_MESSAGES, SUBMIT_TOOL_HISTORY } =
    ToolsAugmentationConstants;

/**
 * The 'tools' augmentation for enabling server-side action/tools calling.
 */
export class ToolsAugmentation implements Augmentation<string | ChatCompletionMessageToolCall[]> {
    private readonly _actions: ChatCompletionAction[];

    public constructor(actions: ChatCompletionAction[]) {
        this._actions = actions;
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
        const validActionToolCalls: ChatCompletionMessageToolCall[] = [];

        if (
            this._actions &&
            response.message &&
            response.message.action_tool_calls &&
            memory.getValue(SUBMIT_TOOL_OUTPUTS_VARIABLE) === true
        ) {
            const actionToolCalls: ChatCompletionMessageToolCall[] = response.message.action_tool_calls!;
            const actions = this._actions;
            const toolChoice = memory.getValue('temp.toolChoice') || 'auto';

            // Call a single tool where tool_choice is a single action definition
            if (toolChoice instanceof Map) {
                const functionName: string = toolChoice.get('function').get('name');
                const currToolCall = actionToolCalls[0];
                let currentTool: ChatCompletionAction | undefined;

                for (const tool of actions) {
                    if (tool.name === functionName) {
                        currentTool = tool;
                        break;
                    }
                }
                if (currentTool) {
                    // Validate required function arguments
                    const requiredArgs: string[] =
                        currentTool &&
                        currentTool.parameters &&
                        currentTool.parameters.required &&
                        Array.isArray(currentTool.parameters.required)
                            ? currentTool.parameters.required
                            : [];
                    const currentArgs = currToolCall.function.arguments;

                    if (requiredArgs && requiredArgs.every((arg) => Object.keys(currentArgs).includes(arg))) {
                        validActionToolCalls.push(currToolCall);
                    } else {
                        validActionToolCalls.push(currToolCall);
                    }
                } else {
                    return Promise.resolve({
                        type: 'Validation',
                        valid: false,
                        feedback: 'The invoked tool does not exist.'
                    });
                }
            } else {
                // Calling multiple tools
                for (const actionToolCall of actionToolCalls) {
                    const functionName = actionToolCall.function.name;
                    let currentTool: ChatCompletionAction | undefined;

                    for (const tool of actions) {
                        if (tool.name === functionName) {
                            currentTool = tool;
                            break;
                        }
                    }
                    // Validate function name
                    if (!currentTool) {
                        continue;
                    }

                    // Validate required function arguments
                    const requiredArgs: string[] =
                        currentTool &&
                        currentTool.parameters &&
                        currentTool.parameters.required &&
                        Array.isArray(currentTool.parameters.required)
                            ? currentTool.parameters.required
                            : [];
                    let currentArgs;
                    try {
                        currentArgs = JSON.parse(actionToolCall.function.arguments);
                    } catch (err) {
                        console.error('ToolsAugmentation validateResponse: Error parsing tool arguments: ', err);
                        currentArgs = {};
                    }

                    if (
                        requiredArgs &&
                        typeof currentArgs === 'object' &&
                        !Array.isArray(currentArgs) &&
                        currentArgs !== null &&
                        requiredArgs.every((arg) => Object.keys(currentArgs).includes(arg))
                    ) {
                        validActionToolCalls.push(actionToolCall);
                    } else {
                        validActionToolCalls.push(actionToolCall);
                    }
                }
                // No tools were valid; reset ToolsAugmentation constants
                if (validActionToolCalls.length === 0) {
                    memory.setValue(SUBMIT_TOOL_OUTPUTS_VARIABLE, false);
                    memory.setValue(SUBMIT_TOOL_OUTPUTS_MAP, {});
                    memory.setValue(SUBMIT_TOOL_OUTPUTS_MESSAGES, []);
                    memory.setValue(SUBMIT_TOOL_HISTORY, []);
                }
            }
        }
        return Promise.resolve({
            type: 'Validation',
            valid: true,
            value: validActionToolCalls.length > 0 ? validActionToolCalls : undefined
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
        response: PromptResponse<string | ChatCompletionMessageToolCall[]>
    ): Promise<Plan> {
        const toolsMap = new Map<string, string>();
        const commands: PredictedCommand[] = [];

        if (response.message && response.message.content) {
            if (memory.getValue(SUBMIT_TOOL_OUTPUTS_VARIABLE) === true && Array.isArray(response.message.content)) {
                const actionToolCalls: ChatCompletionMessageToolCall[] = response.message.content;
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
