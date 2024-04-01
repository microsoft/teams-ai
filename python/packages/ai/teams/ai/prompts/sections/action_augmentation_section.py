"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

from botbuilder.core import TurnContext
from dataclasses_json import DataClassJsonMixin, dataclass_json

from ....state import MemoryBase
from ...models.chat_completion_action import ChatCompletionAction
from ...tokenizers.tokenizer import Tokenizer
from ..message import Message
from ..prompt_functions import PromptFunctions
from ..rendered_prompt_section import RenderedPromptSection
from .prompt_section_base import PromptSectionBase


@dataclass_json
@dataclass
class ActionValue(DataClassJsonMixin):
    description: Optional[str] = None
    parameters: Optional[Union[Dict[str, Any], Dict[str, Dict[str, Any]]]] = None


@dataclass_json
@dataclass
class ActionList(DataClassJsonMixin):
    actions: Dict[str, ActionValue]


class ActionAugmentationSection(PromptSectionBase):
    """
    A prompt section that renders a list of actions to the prompt.
    """

    _text: str
    _token_list: Optional[List[int]] = None
    _actions: Dict[str, ChatCompletionAction] = {}

    @property
    def actions(self) -> Dict[str, ChatCompletionAction]:
        """
        Map of action names to actions.
        """
        return self._actions

    def __init__(self, actions: List[ChatCompletionAction], call_to_action: str) -> None:
        """
        Creates a new `ActionAugmentationSection` instance.

        Args:
            actions (List[ChatCompletionAction]): List of actions to render.
            call_to_action (str): Text to display after the list of actions.

        """
        super().__init__(-1, True, "\n\n")

        # Convert actions to an ActionList
        action_list = ActionList(actions={})

        for action in actions:
            self._actions[action.name] = action
            action_list.actions[action.name] = ActionValue(description=action.description)
            if action.parameters:
                params = action.parameters
                updated_params = (
                    params.get("properties")
                    if params.get("additional_properties") is None
                    else params
                )
                action_list.actions[action.name] = ActionValue(
                    description=action.description, parameters=updated_params
                )

        # Build augmentation text
        self._text = f"{action_list.to_json()}\n\n{call_to_action}"

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message[str]]]:
        """
        Renders the prompt section as a list of `Message` objects.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            memory (MemoryBase): Interface for accessing state variables.
            functions (PromptFunctions): Functions for rendering prompts.
            tokenizer (Tokenizer): Tokenizer to use for encoding/decoding text.
            max_tokens (int): Maximum number of tokens allowed for the rendered prompt.

        Returns:
            RenderedPromptSection[List[Message[str]]]: The rendered prompt section.

        """
        # Tokenize on first use
        if not self._token_list:
            self._token_list = tokenizer.encode(self._text)

        # Check for max tokens
        if len(self._token_list) > max_tokens:
            trimmed = self._token_list[0:max_tokens]
            return RenderedPromptSection[List[Message[str]]](
                output=[Message[str](role="system", content=tokenizer.decode(trimmed))],
                length=len(trimmed),
                too_long=True,
            )
        return RenderedPromptSection[List[Message[str]]](
            output=[Message[str](role="system", content=self._text)],
            length=len(self._token_list),
            too_long=False,
        )
