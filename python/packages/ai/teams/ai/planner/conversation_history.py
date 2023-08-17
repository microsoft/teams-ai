"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List

import tiktoken

from teams.ai.state import ConversationT, TempT, TurnState, UserT


def state_to_history_array(
    state: TurnState[ConversationT, UserT, TempT], maxTokens: int = 1000
) -> List[str]:
    if state.conversation:
        # Get history array if it exists
        history = state.conversation.value.__history__

        # Get encoding for gpt-4 and gpt-3.5-turbo models
        encoding = tiktoken.get_encoding("cl100k_base")

        # Populate up to max chars
        textTokens: int = 0
        lines: List[str] = []
        for i in range(len(history) - 1, -1, -1):
            # Ensure that adding line won't go over the max character length
            line = history[i]
            lineTokens = len(encoding.encode(line))
            newTextTokens = textTokens + lineTokens
            if newTextTokens > maxTokens:
                break

            # Prepend line to output
            textTokens = newTextTokens
            lines.insert(0, line)

        return lines
    else:
        raise ValueError("The state object does not contain conversation state.")
