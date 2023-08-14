"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import abc
from typing import Any, Awaitable, Generic, TypeVar, Union

from botbuilder.core import TurnContext

from teams.ai.turn_state import TurnState

from .prompt_template import PromptTemplate

T = TypeVar("T", bound=TurnState)


class PromptManager(abc.ABC, Generic[T]):
    "interface implemented by all prompt managers"

    @abc.abstractmethod
    def add_function(self, name: str, handler: Awaitable, allow_overrides=False):
        """
        adds a custom function <name> to the prompt manager

        Parameters
        ----------
        `name`: the name of the function\n
        `handler`: callback to be called on function name match\n
        `allow_overrides`: whether to allow overriding an existing function
        """

    @abc.abstractmethod
    def add_prompt_template(self, name: str, template: PromptTemplate):
        """
        adds a prompt template to the prompt manager

        Parameters
        ----------
        `name`: the name of the prompt template\n
        `template`: prompt template to add\n
        """

    @abc.abstractmethod
    async def invoke_function(self, context: TurnContext, state: T, name: str) -> Any:
        """
        invoke a function by name

        Parameters
        ----------
        `context`: current application turn context\n
        `state`: current turn state\n
        `name`: name of the function to invoke
        """

    @abc.abstractmethod
    async def render_prompt(
        self, context: TurnContext, state: T, name_or_template: Union[str, PromptTemplate]
    ) -> PromptTemplate:
        """
        renders a prompt template by name

        Parameters
        ----------
        `context`: current application turn context\n
        `state`: current turn state\n
        `name_or_template`: name of the prompt template to render or a prompt template to render
        """
