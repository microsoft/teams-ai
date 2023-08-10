"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import abc
from typing import Any, Awaitable, Generic, TypeVar, Union

from botbuilder.core import TurnContext
from semantic_kernel import PromptTemplate

from teams.ai.turn_state import TurnState

StateT = TypeVar("StateT", bound=TurnState)


class PromptManager(abc.ABC, Generic[StateT]):
    "interface implemented by all prompt managers"

    @abc.abstractmethod
    def add_function(self, name: str, handler: Awaitable, allow_overrides=False) -> PromptManager:
        """
        Adds a custom function <name> to the prompt manager

        Parameters
        ----------
        `name`: the name of the function\n
        `handler`: callback to be called on function name match\n
        `allow_overrides`: whether to allow overriding an existing function
        """

    @abc.abstractmethod
    def add_prompt_template(self, name: str, template: PromptTemplate) -> PromptManager:
        """
        Adds a prompt template to the prompt manager

        Parameters
        ----------
        `name`: the name of the prompt template\n
        `template`: prompt template to add\n
        """

    @abc.abstractmethod
    async def invoke_function(self, context: TurnContext, state: StateT, name: str) -> Any:
        """
        Invoke a function by name

        Parameters
        ----------
        `context`: current application turn context\n
        `state`: current turn state\n
        `name`: name of the function to invoke
        """

    @abc.abstractmethod
    def load_prompt_template(self, name: str) -> PromptTemplate:
        """
        Loads a named prompt template from the filesystem.

        Parameters
        ----------
        `name`: name of the template to load
        """

    @abc.abstractmethod
    async def render_prompt(
        self, context: TurnContext, state: StateT, name_or_template: Union[str, PromptTemplate]
    ) -> PromptTemplate:
        """
        Renders a prompt template by name

        Parameters
        ----------
        `context`: current application turn context\n
        `state`: current turn state\n
        `name_or_template`: name of the prompt template to render or a prompt template to render
        """
