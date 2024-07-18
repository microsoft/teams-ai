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
     * Boolean flag to denote roundtrip tool calls to the LLM.
     */
    SUBMIT_TOOL_OUTPUTS_VARIABLE: 'temp.submit_tool_outputs',
    /**
     * Map of tool_name and tool_id
     */
    SUBMIT_TOOL_OUTPUTS_MAP: 'temp.submit_tool_outputs_map',
    /**
     * Map of tool_name to tool_output messages
     */
    SUBMIT_TOOL_OUTPUTS_MESSAGES: 'temp.submit_tool_outputs_messages'
};
