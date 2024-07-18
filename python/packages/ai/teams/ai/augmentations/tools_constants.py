"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

# Set of constants used for action tool handling

SUBMIT_TOOL_OUTPUTS_VARIABLE = "temp.submit_tool_outputs"
# Boolean flag to denote roundtrip tool calls

SUBMIT_TOOL_OUTPUTS_MAP = "temp.submit_tool_map"
# Map of tool_name to tool_id

SUBMIT_TOOL_OUTPUTS_MESSAGES = "temp.submit_tool_messages"
# Map of tool_name to tool_output messages

SUBMIT_TOOL_HISTORY = "temp.tool_history"
# List of all the messages from the model
