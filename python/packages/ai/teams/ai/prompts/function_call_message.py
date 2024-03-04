"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
from dataclasses import asdict
from typing import List

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..tokenizers import Tokenizer
from .function_call import FunctionCall
from .message import Message
from .prompt_functions import PromptFunctions
from .rendered_prompt_section import RenderedPromptSection
from .sections.prompt_section_base import PromptSectionBase


class FunctionCallMessage(PromptSectionBase):
    """
    An `assistant` message containing a function to call.

    The function call information is returned by the model so we use an "assistant" message to
    represent it in conversation history.
    """

    _length: int
    _function_call: FunctionCall

    def __init__(
        self, function_call: FunctionCall, tokens: float = -1, assistant_prefix: str = "assistant: "
    ):
        """
        Creates a new `FunctionCallMessage` instance.

        Args:
            function_call (FunctionCall): Name and arguments of the function to call.
            tokens (int, optional): Sizing strategy for this section. Defaults to `auto`.
            assistant_prefix (str, optional): Prefix to use for assistant messages when
              rendering as text. Defaults to `assistant: `.
        """
        super().__init__(tokens, True, "\n", assistant_prefix)
        self._length: int = -1
        self._function_call: FunctionCall = function_call

    @property
    def function_call(self) -> FunctionCall:
        """
        Name and arguments of the function to call.
        """
        return self._function_call

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: "MemoryBase",
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message]]:
        """
        Renders the section as a list of messages.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            memory (MemoryBase): An interface for accessing state values.
            functions (PromptFunctions): Registry of functions that can be used by the section.
            tokenizer (Tokenizer): Tokenizer to use when rendering the section.
            max_tokens (int): Maximum number of tokens allowed to be rendered.

        Returns:
            RenderedPromptSection[List[Message]]: The rendered prompt section as a list of messages.
        """
        # Calculate and cache response text and length
        if self._length < 0:
            self._length = len(tokenizer.encode(json.dumps(asdict(self.function_call))))

        # Return output
        return self._return_messages(
            [Message("assistant", function_call=self.function_call)],
            self._length,
            tokenizer,
            max_tokens,
        )
