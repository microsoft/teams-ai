"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import base64
from typing import Any, List

from botbuilder.core import TurnContext

from ...input_file import InputFile
from ...state import MemoryBase
from ..tokenizers import Tokenizer
from .message import (
    ImageContentPart,
    ImageUrl,
    Message,
    MessageContentParts,
    TextContentPart,
)
from .prompt_functions import PromptFunctions
from .rendered_prompt_section import RenderedPromptSection
from .sections.prompt_section_base import PromptSectionBase


class UserInputMessage(PromptSectionBase):
    """
    A section capable of rendering user input text and images as a user message.
    """

    _input_variable: str
    _files_variable: str

    def __init__(
        self, tokens: float = -1, input_variable: str = "input", files_variable: str = "input_files"
    ):
        """
        Creates a new 'UserInputMessage' instance.

        Args:
            tokens (float, optional): Sizing strategy for this section. Defaults to `auto`.
            input_variable (str, optional): Name of the variable containing the user input text.
              Defaults to `input`.
            files_variable (str, optional): Name of the variable containing the user input files.
              Defaults to `inputFiles`.
        """
        super().__init__(tokens, True, "\n", "user: ")
        self._input_variable = input_variable
        self._files_variable = files_variable

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message[Any]]]:
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
        input_text: str = memory.get(self._input_variable) or ""
        input_files: List[InputFile] = memory.get(self._files_variable) or []

        message: Message[List[MessageContentParts]] = Message("user", [])

        length = 0
        budget = self._get_token_budget(max_tokens)
        if len(input_text) > 0:
            encoded = tokenizer.encode(input_text)
            if len(encoded) <= budget:
                if message.content is not None:
                    message.content.append(TextContentPart(type="text", text=input_text))
                    length += len(encoded)
                    budget -= len(encoded)
            else:
                if message.content is not None:
                    message.content.append(
                        TextContentPart(type="text", text=tokenizer.decode(encoded[:budget]))
                    )
                    length += budget
                    budget = 0

        # Append image content parts
        images = [f for f in input_files if f.content_type.startswith("image/")]
        for image in images:
            # Check for budget to add image
            if budget < 85:
                break

            url = (
                f"data:{image.content_type};base64,"
                f"{base64.b64encode(image.content).decode('utf-8')}"
            )
            if message.content is not None:
                message.content.append(ImageContentPart(type="image_url", image_url=ImageUrl(url)))
                length += 85
                budget -= 85

        return RenderedPromptSection(output=[message], length=length, too_long=False)
