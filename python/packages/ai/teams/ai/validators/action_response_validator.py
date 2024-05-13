"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List

from botbuilder.core import TurnContext

from ...state import MemoryBase
from ..models.chat_completion_action import ChatCompletionAction
from ..models.prompt_response import PromptResponse
from ..prompts.message import Message
from ..tokenizers import Tokenizer
from .json_response_validator import JSONResponseValidator
from .prompt_response_validator import PromptResponseValidator
from .validation import Validation


@dataclass
class ValidatedChatCompletionAction:
    """
    A validated action call.
    """

    name: str
    """
    Name of the action to call.
    """

    parameters: Dict[str, Any] = field(default_factory=dict)
    """
    Arguments to pass to the action.
    """


class ActionResponseValidator(PromptResponseValidator):
    """
    Default response validator that always returns true.
    """

    _actions: Dict[str, ChatCompletionAction] = {}
    _required: bool
    _noun: str

    def __init__(
        self,
        actions: List[ChatCompletionAction],
        required: bool = False,
        noun: str = "action",
    ) -> None:
        """
        Creates a new `ActionResponseValidator` instance.
        """

        super().__init__()

        self._required = required
        self._noun = noun

        for action in actions:
            self._actions[action.name] = action

    @property
    def actions(self) -> List[ChatCompletionAction]:
        """
        Gets a list of the actions configured for the validator.
        """

        arr: List[ChatCompletionAction] = []

        for _, action in self._actions.items():
            arr.append(action)

        return arr

    async def validate_response(
        self,
        context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        response: PromptResponse[str],
        remaining_attempts: int,
    ) -> Validation:
        message = response.message
        func = response.message.function_call if response.message is not None else None

        if message is None or func is None:
            if not self._required:
                return Validation()

            return Validation(
                valid=False,
                feedback=(
                    f"No {self._noun} was specified. Call a {self._noun} with valid arguments."
                ),
            )

        if func.name is None:
            return Validation(
                valid=False,
                feedback=f"{self._noun} name missing. Specify a valid {self._noun} name.",
            )

        if not func.name in self._actions:
            return Validation(
                valid=False,
                feedback=(
                    f'Unknown {self._noun} named "{func.name}". Specify a valid {self._noun} name.'
                ),
            )

        params: Dict[str, Any] = {}
        action = self._actions[func.name]

        if action.parameters is not None:
            validator = JSONResponseValidator(
                schema=action.parameters,
                missing_json_feedback=(
                    f"No arguments were sent with called {self._noun}. "
                    f'Call the "{func.name}" {self._noun} with required '
                    "arguments as a valid JSON object."
                ),
                error_feedback=(
                    f"The {self._noun} arguments had errors. "
                    f'Apply these fixes and call "{func.name}" {self._noun} again:'
                ),
            )

            res = await validator.validate_response(
                context=context,
                memory=memory,
                tokenizer=tokenizer,
                remaining_attempts=remaining_attempts,
                response=PromptResponse(
                    message=Message(
                        role="assistant", content="{}" if func.arguments is None else func.arguments
                    )
                ),
            )

            if not res.valid:
                return Validation(valid=False, feedback=res.feedback)

            if res.value is not None:
                params = res.value

        return Validation(
            valid=True, value=ValidatedChatCompletionAction(name=func.name, parameters=params)
        )
