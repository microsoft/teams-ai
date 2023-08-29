"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
import os
from typing import Awaitable, Callable, Dict, Generic, TypeVar, Union

import semantic_kernel as sk
from botbuilder.core import TurnContext
from semantic_kernel.skill_definition import sk_function

from teams.ai.state import TurnState
from teams.app_error import ApplicationError

from .prompt_template import PromptTemplate
from .prompt_template_config import PromptTemplateConfig
from .utils import generate_sk_prompt_template_config

SK_CONFIG_FILE_NAME = "config.json"
SK_PROMPT_FILE_NAME = "skprompt.txt"
StateT = TypeVar("StateT", bound=TurnState)


class PromptManager(Generic[StateT]):
    """
    Prompt manager used by action planner internally
    """

    _prompts_folder: str
    _templates: Dict[str, PromptTemplate] = {}
    _functions: Dict[str, Callable[[TurnContext, StateT], Awaitable[str]]] = {}

    def __init__(self, prompts_folder: str = "prompts") -> None:
        """
        Initializes a new instance of the DefaultPromptManager class.

        :param prompts_folder: The base folder path where the prompt files are located.
        """
        self._prompts_folder = prompts_folder

    def add_function(
        self,
        name: str,
        handler: Callable[[TurnContext, StateT], Awaitable[str]],
        allow_overrides=False,
    ):
        """
        Adds a new function to the prompt manager.

        :param name: The name of the function.
        :param handler: The function handler.
        :param allow_overrides: Whether to allow overriding an existing function with the same name.
        """
        if not allow_overrides and self._functions.get(name):
            raise ApplicationError(f"Function {name} already exists")

        self._functions[name] = handler
        return self

    async def render_prompt(
        self, context: TurnContext, state: StateT, name_or_template: Union[str, PromptTemplate]
    ) -> PromptTemplate:
        """
        Renders the given prompt template.

        :param context: The turn context for current turn of conversation.
        :param state: The current turn state.
        :param name_or_template: The name of the prompt template or the prompt template itself.
        """
        prompt_template: PromptTemplate
        if isinstance(name_or_template, str):
            prompt_folder: str = os.path.join(self._prompts_folder, name_or_template)

            prompt_config: PromptTemplateConfig = PromptTemplateConfig.from_dict(
                json.loads(self._read_file(os.path.join(prompt_folder, SK_CONFIG_FILE_NAME)))
            )

            prompt_text: str = self._read_file(os.path.join(prompt_folder, SK_PROMPT_FILE_NAME))
            prompt_template = PromptTemplate(prompt_text, prompt_config)
        else:
            prompt_template = name_or_template

        return await self._render_prompt_with_sk(prompt_template, context, state)

    def _read_file(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise ApplicationError(
                f"Missing prompt config or text file: {file_path} does not exist"
            )
        with open(file_path, "r", encoding="utf8") as file:
            return file.read()

    async def _render_prompt_with_sk(
        self, prompt_template: PromptTemplate, turn_context: TurnContext, turn_state: StateT
    ) -> PromptTemplate:
        kernel = sk.Kernel()
        for function_name, function in self._functions.items():
            # A workaround to register single native function.
            # TODO: Use latest SK package which supports register
            # single native function when it is available.

            # pylint: disable=W0640
            # Reason: the logic won't be impacted by the warning
            # and SK is going to support register single native function.
            # So no need to spend extra time on this warning.
            class Wrapper:
                @sk_function(name=function_name)
                async def run(self):
                    return await function(turn_context, turn_state)

            kernel.import_skill(Wrapper())

        sk_context = kernel.create_new_context()
        # Set built-in variables
        sk_context.variables.set("input", turn_state.temp.value.input)
        sk_context.variables.set("history", turn_state.temp.value.history)
        sk_context.variables.set("output", turn_state.temp.value.output)

        sk_template = sk.PromptTemplate(
            prompt_template.text,
            kernel.prompt_template_engine,
            generate_sk_prompt_template_config(prompt_template),
        )
        rendered_prompt = await sk_template.render_async(sk_context)
        return PromptTemplate(rendered_prompt, prompt_template.config)
