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
     * 'temp.tool_history': List of all the messages from the model.
     */
    SUBMIT_TOOL_HISTORY: 'temp.tool_history',
    /**
     * 'temp.submit_tool_outputs_map': Map of tool_name and tool_id
     */
    SUBMIT_TOOL_OUTPUTS_MAP: 'temp.submit_tool_outputs_map',
    /**
     * 'temp.submit_tool_outputs_messages': List of tools messages sent back from LLM.
     */
    SUBMIT_TOOL_OUTPUTS_MESSAGES: 'temp.submit_tool_outputs_messages',
    /**
     * 'temp.submit_tool_outputs': Boolean flag to denote roundtrip tool calls to the LLM.
     */
    SUBMIT_TOOL_OUTPUTS_VARIABLE: 'temp.submit_tool_outputs'
};
