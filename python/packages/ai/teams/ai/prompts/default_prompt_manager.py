"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

# pylint: disable=W0640

import os
from typing import Callable, Dict, Union

from botbuilder.core import TurnContext
from semantic_kernel import Kernel, PromptTemplate, PromptTemplateConfig
from semantic_kernel.skill_definition import sk_function

from teams.ai.exceptions import AIException
from teams.ai.turn_state import TurnState

SK_CONFIG_FILE_NAME = "config.json"
SK_PROMPT_FILE_NAME = "skprompt.txt"


class DefaultPromptManager:
    """
    Prompt manager used by action planner internally
    """

    _prompts_folder: str
    _templates: Dict[str, PromptTemplate] = {}
    _functions: Dict[str, Callable[[TurnContext, TurnState], str]] = {}

    def __init__(self, prompts_folder: str) -> None:
        """
        Initializes a new instance of the DefaultPromptManager class.

        :param prompts_folder: The base folder path where the prompt files are located.
        """
        self._prompts_folder = prompts_folder
        self._templates = {}
        self._functions = {}

    def add_function(
        self, name: str, handler: Callable[[TurnContext, TurnState], str], allow_overrides=False
    ):
        """
        Adds a new function to the prompt manager.

        :param name: The name of the function.
        :param handler: The function handler.
        :param allow_overrides: Whether to allow overriding an existing function with the same name.
        """
        if not allow_overrides and self._functions.get(name):
            raise AIException(f"Function {name} already exists")

        self._functions[name] = handler
        return self

    async def render_prompt(
        self, context: TurnContext, state: TurnState, name_or_template: Union[str, PromptTemplate]
    ) -> str:
        """
        Renders the given prompt template.

        :param context: The turn context for current turn of conversation.
        :param state: The current turn state.
        :param name_or_template: The name of the prompt template or the prompt template itself.
        """
        prompt_template: PromptTemplate
        sk: Kernel = Kernel()
        if isinstance(name_or_template, str):
            prompt_folder: str = os.path.join(self._prompts_folder, name_or_template)
            prompt_config: PromptTemplateConfig = PromptTemplateConfig.from_json(
                self._read_file(os.path.join(prompt_folder, SK_CONFIG_FILE_NAME))
            )
            prompt_text: str = self._read_file(os.path.join(prompt_folder, SK_PROMPT_FILE_NAME))
            prompt_template: PromptTemplate = PromptTemplate(
                prompt_text, sk.prompt_template_engine, prompt_config
            )
        else:
            prompt_template = name_or_template

        context = self._create_kernel_context(sk, context, state)
        return await prompt_template.render_async(context)

    def _read_file(self, file_path: str) -> str:
        if not os.path.exists(file_path):
            raise AIException(f"Missing prompt config or text file: {file_path} does not exist")
        with open(file_path, "r", encoding="utf8") as file:
            return file.read()

    def _create_kernel_context(
        self, kernel: Kernel, context: TurnContext, state: TurnState
    ) -> None:
        for function_name, function in self._functions.items():

            class Wrapper:
                @sk_function(name=function_name)
                def run(self):
                    return function(context, state)

            kernel.import_skill(Wrapper())

        return kernel.create_new_context()
