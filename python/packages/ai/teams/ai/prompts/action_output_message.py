"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..tokenizers import Tokenizer
from .message import Message
from .prompt_functions import PromptFunctions
from .rendered_prompt_section import RenderedPromptSection
from .sections.prompt_section_base import PromptSectionBase


class ActionOutputMessage(PromptSectionBase):
    """
    A section capable of rendering action outputs.
    """

    _output_variable: str
    _history_variable: str

    def __init__(
        self,
        history_variable: str,
        output_variable: str = "temp.action_outputs",
    ):
        """
        Creates a new 'ActionOutputMessage' instance.

        Args:
            history_variable (str): Name of the conversation history.
            output_variable (str, optional): Name of the action outputs.
              Defaults to `action_outputs`.
        """
        super().__init__(-1, True, "\n", "action: ")
        self._output_variable = output_variable
        self._history_variable = history_variable

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message[str]]]:
        """
        Renders the actions section as a list of messages.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): An interface for accessing state values.
            functions (PromptFunctions): Registry of functions that can be used by the section.
            tokenizer (Tokenizer): Tokenizer to use when rendering the section.
            max_tokens (int): Maximum number of tokens allowed to be rendered.

        Returns:
            RenderedPromptSection[List[Message]]: The rendered prompt section as a list of messages.
        """

        history: List[Message] = memory.get(self._history_variable) or []
        messages: List[Message] = []

        if len(history) > 1:
            action_outputs = memory.get(self._output_variable) or {}
            action_calls = history[-1].action_calls or []

            for action_call in action_calls:
                output = action_outputs[action_call.id]
                message = Message[str](role="tool", action_call_id=action_call.id, content=output)
                messages.append(message)

        return RenderedPromptSection(output=messages, length=len(messages), too_long=False)
