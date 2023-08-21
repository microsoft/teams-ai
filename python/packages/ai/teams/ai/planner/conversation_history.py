"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List

import tiktoken

from teams.ai.state import ConversationT, TempT, TurnState, UserT


def state_to_history_array(
    state: TurnState[ConversationT, UserT, TempT], max_tokens: int = 1000
) -> List[str]:
    if state.conversation:
        # Get history array if it exists
        history = state.conversation.value.history

        # Get encoding for gpt-4 and gpt-3.5-turbo models
        encoding = tiktoken.get_encoding("cl100k_base")

        # Populate up to max chars
        text_tokens: int = 0
        lines: List[str] = []
        for i in range(len(history) - 1, -1, -1):
            # Ensure that adding line won't go over the max character length
            message = history[i]
            line_tokens = len(encoding.encode(message.content))
            new_text_tokens = text_tokens + line_tokens
            if new_text_tokens > max_tokens:
                break

            # Prepend line to output
            text_tokens = new_text_tokens
            lines.insert(0, message.content)

        return lines

    raise ValueError("The state object does not contain conversation state.")
