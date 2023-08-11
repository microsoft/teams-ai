"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

# pylint: disable=W0640

from __future__ import annotations

import os
from typing import Any, Awaitable, Callable, Dict, Generic, TypeVar, Union

from botbuilder.core import TurnContext
from semantic_kernel import Kernel, PromptTemplate, PromptTemplateConfig
from semantic_kernel.skill_definition import sk_function
from semantic_kernel.template_engine.prompt_template_engine import PromptTemplateEngine

from teams.ai.exceptions import PromptManagerException
from teams.ai.state import TurnState

SK_CONFIG_FILE_NAME = "config.json"
SK_PROMPT_FILE_NAME = "skprompt.txt"

StateT = TypeVar("StateT", bound=TurnState)
PromptFunction = Callable[[TurnContext, StateT], Awaitable[Any]]


class PromptManager(Generic[StateT]):
    """
    Prompt manager used by action planner internally
    """

    _prompts_folder: str
    _templates: Dict[str, PromptTemplate] = {}
    _functions: Dict[str, PromptFunction] = {}
    _variables: Dict[str, str] = {}

    def __init__(self, prompts_folder="") -> None:
        """
        Initializes a new instance of the DefaultPromptManager class.

        :param prompts_folder: The base folder path where the prompt files are located.
        """
        self._prompts_folder = prompts_folder

    def add_function(
        self, name: str, handler: PromptFunction, allow_overrides=False
    ) -> PromptManager:
        """
        Adds a custom function <name> to the prompt manager

        Parameters
        ----------
        `name`: the name of the function\n
        `handler`: callback to be called on function name match\n
        `allow_overrides`: whether to allow overriding an existing function
        """
        if not allow_overrides and self._functions.get(name):
            raise PromptManagerException(f"Function {name} already exists")

        self._functions[name] = handler
        return self

    def add_prompt_template(self, name: str, template: PromptTemplate) -> PromptManager:
        """
        Adds a prompt template to the prompt manager

        Parameters
        ----------
        `name`: the name of the prompt template\n
        `template`: prompt template to add\n
        """
        if self._templates.get(name):
            raise PromptManagerException(f"Text template `{name}` already exists")

        self._templates[name] = template
        return self

    async def invoke_function(self, context: TurnContext, state: StateT, name: str) -> Any:
        """
        Invoke a function by name

        Parameters
        ----------
        `context`: current application turn context\n
        `state`: current turn state\n
        `name`: name of the function to invoke
        """
        func = self._functions.get(name)

        if not func:
            raise PromptManagerException(
                f"Attempting to invoke an unregistered function name {name}"
            )

        return await func(context, state)

    def load_prompt_template(self, name: str) -> PromptTemplate:
        """
        Loads a named prompt template from the filesystem.

        Parameters
        ----------
        `name`: name of the template to load
        """
        template = self._templates.get(name)

        if template:
            return template

        folder_path = os.path.join(self._prompts_folder, name)
        prompt_path = os.path.join(folder_path, SK_PROMPT_FILE_NAME)
        config_path = os.path.join(folder_path, SK_CONFIG_FILE_NAME)

        if not os.path.isdir(folder_path):
            raise PromptManagerException(f"Directory `{folder_path}` doesn't exist")

        if not os.path.isfile(prompt_path):
            raise PromptManagerException(f"File `{prompt_path}` doesn't exist")

        if not os.path.isfile(config_path):
            raise PromptManagerException(f"File `{config_path}` doesn't exist")

        with open(prompt_path, "r", encoding="utf8") as file:
            prompt = file.read()

        try:
            with open(config_path, "r", encoding="utf8") as file:
                config = PromptTemplateConfig.from_json(file.read())

            return PromptTemplate(
                template=prompt, template_engine=PromptTemplateEngine(), prompt_config=config
            )
        except Exception as e:
            raise PromptManagerException(f"Error while loading prompt. {e}") from e

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
        sk = Kernel()
        ctx = self._create_kernel_context(sk, context, state)

        if isinstance(name_or_template, str):
            prompt_template = self.load_prompt_template(name_or_template)
        else:
            prompt_template = name_or_template

        out = await prompt_template.render_async(ctx)
        return PromptTemplate(
            template=out,
            template_engine=sk.prompt_template_engine,
            prompt_config=prompt_template._prompt_config,
        )

    def _create_kernel_context(self, kernel: Kernel, context: TurnContext, state: StateT):
        for name, function in self._functions.items():
            kernel.import_skill(sk_function(name=name)(lambda: function(context, state)))

        return kernel.create_new_context()
