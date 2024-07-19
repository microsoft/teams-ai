/**
 * @module teams-ai
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Constants for action tool handling.
 */
export const ToolsAugmentationConstants = {
    /**
     * 'temp.toolHistory': List of all the messages from the model.
     */
    SUBMIT_TOOL_HISTORY: 'temp.toolHistory',
    /**
     * 'temp.submitToolOutputsMap': Map of tool_name and tool_id
     */
    SUBMIT_TOOL_OUTPUTS_MAP: 'temp.submitToolOutputsMap',
    /**
     * 'temp.submitToolOutputsMessages': List of tools messages sent back from LLM.
     */
    SUBMIT_TOOL_OUTPUTS_MESSAGES: 'temp.submitToolOutputsMessages',
    /**
     * 'temp.submitToolOutputs': Boolean flag to denote roundtrip tool calls to the LLM.
     */
    SUBMIT_TOOL_OUTPUTS_VARIABLE: 'temp.submitToolOutputs'
};
