"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class PromptManagerOptions:
    """
    Options for the PromptManager.
    """

    prompts_folder: str
    """Path to the filesystem folder containing all the applications prompts."""

    role: str = "system"
    """
    Optional. Message role to use for loaded prompts.
    Defaults to 'system'.
    """

    max_conversation_history_tokens: float = 1.0
    """
    Optional. Maximum number of tokens of conversation history to include in prompts.
    The default is to let conversation history consume the remainder of the prompts
    `max_input_tokens` budget. Setting this a value greater then 1 will override that and
    all prompts will use a fixed token budget.
    """

    max_history_messages: int = 10
    """
    Optional. Maximum number of messages to use when rendering conversation_history.
    This controls the automatic pruning of the conversation history that's done by the planners
    LLMClient instance. This helps keep your memory from getting too big and defaults to a value
    of `10` (or 5 turns.)
    """

    max_input_tokens: int = -1
    """
    Optional. Maximum number of tokens user input to include in prompts.
    This defaults to unlimited but can set to a value greater then `1` to limit the length of
    user input included in prompts. For example, if set to `100` then the any user input over
    100 tokens in length will be truncated.
    """
