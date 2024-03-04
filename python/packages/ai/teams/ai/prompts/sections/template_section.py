"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from enum import Enum
from typing import Awaitable, Callable, List

from botbuilder.core import TurnContext

from ....app_error import ApplicationError
from ....state import MemoryBase
from ...tokenizers import Tokenizer
from ...utilities import to_string
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection
from .prompt_section_base import PromptSectionBase


# private
class _ParseState(Enum):
    IN_TEXT = 1
    IN_PARAMETER = 2
    IN_STRING = 3


# private
_PartRenderer = Callable[[TurnContext, MemoryBase, PromptFunctions, Tokenizer, int], Awaitable[str]]


class TemplateSection(PromptSectionBase):
    """
    A template section that will be rendered as a message.

    This section type is used to render a template as a message. The template can contain
    parameters that will be replaced with values from memory or call functions to generate
    dynamic content.

    Template syntax:
    - `{{$memoryKey}}` - Renders the value of the specified memory key.
    - `{{functionName}}` - Calls the specified function and renders the result.
    - `{{functionName arg1 arg2 ...}}` - Calls the specified function with the
      provided list of arguments.

    Function arguments are optional and separated by spaces.
    They can be quoted using ', ", or ` delimiters.
    """

    _template: str
    _role: str
    _parts: List[_PartRenderer]

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
    def __init__(
        self,
        template: str,
        role: str,
        tokens: float = -1,
        required: bool = True,
        separator: str = "\n",
        text_prefix: str = "",
    ):
        """
        Creates a new 'TemplateSection' instance.

        Args:
            template (str): Template to use for this section.
            role (str): Message role to use for this section.
            tokens (int, optional): Sizing strategy for this section. Defaults to `auto`.
            required (bool, optional): Indicates if this section is required. Defaults to `True`.
            separator (str, optional): Separator to use between sections when rendering as text.
              Defaults to `\n`.
            text_prefix (str, optional): The text prefix. Prefix to use for text output.
              Defaults to ''.

        """
        super().__init__(tokens, required, separator, text_prefix)
        self._template = template
        self._role = role
        self._parts: List[_PartRenderer] = []
        self._parse_template()

    # pylint: enable=too-many-arguments

    @property
    def template(self) -> str:
        """str: The template string."""
        return self._template

    @property
    def role(self) -> str:
        """str: The role of the template."""
        return self._role

    # pylint: disable=too-many-arguments # No argument can be removed based on the design
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

        rendered_parts = [
            await part(context, memory, functions, tokenizer, max_tokens) for part in self._parts
        ]

        # Join all parts
        text = "".join(rendered_parts)
        length = len(tokenizer.encode(text))

        # Return output
        messages = [Message(self.role, text)] if length > 0 else []
        return self._return_messages(messages, length, tokenizer, max_tokens)

    # pylint: enable=too-many-arguments

    def _parse_template(self):
        # Parse template
        part = ""
        state = _ParseState.IN_TEXT
        string_delim = ""
        i = 0
        while i < len(self.template):
            char = self.template[i]
            if state == _ParseState.IN_TEXT:
                if char == "{" and i + 1 < len(self.template) and self.template[i + 1] == "{":
                    if len(part) > 0:
                        self._parts.append(self._create_text_renderer(part))
                        part = ""
                    state = _ParseState.IN_PARAMETER
                    i += 1
                else:
                    part += char
            elif state == _ParseState.IN_PARAMETER:
                if char == "}" and i + 1 < len(self.template) and self.template[i + 1] == "}":
                    if len(part) > 0:
                        part = part.strip()
                        if part[0] == "$":
                            self._parts.append(self._create_variable_renderer(part[1:]))
                        else:
                            self._parts.append(self._create_function_renderer(part))
                        part = ""

                    state = _ParseState.IN_TEXT
                    i += 1
                elif char in ["'", '"', "`"]:
                    string_delim = char
                    state = _ParseState.IN_STRING
                    part += char
                else:
                    part += char
            elif state == _ParseState.IN_STRING:
                part += char
                if char == string_delim:
                    state = _ParseState.IN_PARAMETER

            i += 1

        # Ensure we ended in the correct state
        if state != _ParseState.IN_TEXT:
            raise ApplicationError(f"Invalid template: {self.template}")

        # Add final part
        if len(part) > 0:
            self._parts.append(self._create_text_renderer(part))

    def _create_text_renderer(self, text: str) -> _PartRenderer:
        async def renderer(
            _context: TurnContext,
            _memory: MemoryBase,
            _functions: PromptFunctions,
            _tokenizer: Tokenizer,
            _max_tokens: int,
        ) -> str:
            return text

        return renderer

    def _create_variable_renderer(self, name: str) -> _PartRenderer:
        async def renderer(
            _context: TurnContext,
            memory: MemoryBase,
            _functions: PromptFunctions,
            tokenizer: Tokenizer,
            _max_tokens: int,
        ) -> str:
            return to_string(tokenizer, memory.get(name))

        return renderer

    def _create_function_renderer(self, param: str) -> _PartRenderer:
        name = ""
        args: List[str] = []

        # Parse function name and args
        part = ""
        state = _ParseState.IN_TEXT
        string_delim = ""
        for _, char in enumerate(param):
            if state == _ParseState.IN_TEXT:
                if char in ["'", '"', "`"]:
                    if len(part) > 0:
                        if not name:
                            name = part
                        else:
                            args.append(part)
                        part = ""
                    string_delim = char
                    state = _ParseState.IN_STRING
                elif char == " ":
                    if len(part) > 0:
                        if not name:
                            name = part
                        else:
                            args.append(part)
                        part = ""
                else:
                    part += char
            elif state == _ParseState.IN_STRING:
                if char == string_delim:
                    if len(part) > 0:
                        if not name:
                            name = part
                        else:
                            args.append(part)
                        part = ""
                    state = _ParseState.IN_TEXT
                else:
                    part += char

        # Add final part
        if len(part) > 0:
            if not name:
                name = part
            else:
                args.append(part)

        async def renderer(
            context: TurnContext,
            memory: MemoryBase,
            functions: PromptFunctions,
            tokenizer: Tokenizer,
            _max_tokens: int,
        ) -> str:
            value = await functions.invoke_function(name, context, memory, tokenizer, args)
            return to_string(tokenizer, value)

        return renderer
