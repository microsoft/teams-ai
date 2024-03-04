"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any, List

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..tokenizers import Tokenizer
from ..utilities import to_string
from .message import Message
from .prompt_functions import PromptFunctions
from .rendered_prompt_section import RenderedPromptSection
from .sections.prompt_section_base import PromptSectionBase


class FunctionResponseMessage(PromptSectionBase):
    """
    Message containing the response to a function call.
    """

    _text: str
    _length: int
    _name: str
    _response: Any

    def __init__(
        self, name: str, response: Any, tokens: float = -1, function_prefix: str = "user: "
    ):
        """
        Creates a new `FunctionResponseMessage` instance.

        Args:
            name (str): Name of the function that was called.
            response (Any): The response returned by the called function.
            tokens (int, optional): Sizing strategy for this section. Defaults to `auto`.
            function_prefix (str, optional): Prefix to use for function messages when
              rendering as text. Defaults to `user: `  to simulate the response
              coming from the user..

        """
        super().__init__(tokens, True, "\n", function_prefix)
        self._text = ""
        self._length = -1
        self._name = name
        self._response = response

    @property
    def name(self) -> str:
        """
        Name of the function that was called.
        """
        return self._name

    @property
    def response(self) -> Any:
        """
        The response returned by the called function.
        """
        return self._response

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
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
            self._text = to_string(tokenizer, self.response)
            self._length = len(tokenizer.encode(self.name)) + len(tokenizer.encode(self._text))

        # Return output
        return self._return_messages(
            [Message("function", name=self.name, content=self._text)],
            self._length,
            tokenizer,
            max_tokens,
        )
