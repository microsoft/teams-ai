"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Union

import yaml
from botbuilder.core import TurnContext

from teams.ai.modelsv2.chat_completion_action import ChatCompletionAction
from teams.ai.promptsv2.message import Message
from teams.ai.promptsv2.prompt_functions import PromptFunctions
from teams.ai.promptsv2.prompt_section_base import PromptSectionBase
from teams.ai.promptsv2.rendered_prompt_section import RenderedPromptSection
from teams.ai.tokenizers.tokenizer import Tokenizer
from teams.state.memory import Memory


@dataclass
class ActionValue:
    description: Optional[str] = None
    parameters: Optional[Union[Dict[str, Any], Dict[str, Dict[str, Any]]]] = None


@dataclass
class ActionList:
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
        action_list: ActionList = {"actions": {}}

        for action in actions:
            self._actions[action.name] = action
            action_list["actions"][action.name] = {}
            if action.description:
                action_list["actions"][action.name]["description"] = action.description
            if action.parameters:
                params = action.parameters
                action_list["actions"][action.name]["parameters"] = (
                    params.get("properties")
                    if params.get("additional_properties") is None
                    else params
                )

        # Build augmentation text
        self._text = f"{yaml.dump(action_list)}\n\n{call_to_action}"

    async def render_as_messages(
        self,
        context: TurnContext,
        memory: Memory,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        max_tokens: int,
    ) -> RenderedPromptSection[List[Message[str]]]:
        """
        Renders the prompt section as a list of `Message` objects.

        Args:
            context (TurnContext): Context for the current turn of conversation.
            memory (Memory): Interface for accessing state variables.
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
