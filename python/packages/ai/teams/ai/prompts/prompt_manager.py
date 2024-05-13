"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import json
import os
from copy import deepcopy
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from botbuilder.core import TurnContext

import teams.ai.augmentations

from ...app_error import ApplicationError
from ...state import MemoryBase
from ..data_sources import DataSource
from ..models.chat_completion_action import ChatCompletionAction
from ..tokenizers import Tokenizer
from .prompt import Prompt
from .prompt_functions import PromptFunction, PromptFunctions
from .prompt_manager_options import PromptManagerOptions
from .prompt_template import PromptTemplate
from .prompt_template_config import PromptTemplateConfig
from .sections import (
    ConversationHistorySection,
    GroupSection,
    PromptSection,
    TemplateSection,
)
from .sections.data_source_section import DataSourceSection
from .user_input_message import UserInputMessage
from .user_message import UserMessage


class PromptManager(PromptFunctions):
    _options: PromptManagerOptions
    _data_sources: Dict[str, DataSource]
    _functions: Dict[str, PromptFunction]
    _prompts: Dict[str, PromptTemplate]

    def __init__(self, options: PromptManagerOptions):
        """
        Creates a new 'PromptManager' instance.

        Args:
            options (PromptManagerOptions): Options used to configure the prompt manager.
        """
        self._options = options
        self._data_sources = {}
        self._functions = {}
        self._prompts = {}

    @property
    def options(self) -> PromptManagerOptions:
        """
        Gets the configured prompt manager options.
        """
        return self._options

    def function(self, name: Optional[str] = None) -> Callable[[PromptFunction], PromptFunction]:
        """
        Registers a new prompt function event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @prompts.function()
        async def hello_world(context: TurnContext, state: TurnState, entities: Any, name: str):
            print("hello world!")
            return True

        # Pass a function to this method
        prompts.function()(hello_world)
        ```

        Args:
        - `name`: The name of the action `Default: Function Name`
        """

        def __call__(func: PromptFunction) -> PromptFunction:
            func_name = name

            if not func_name:
                func_name = func.__name__

            self.add_function(func_name, func)
            return func

        return __call__

    def add_data_source(self, data_source: DataSource) -> "PromptManager":
        """
        Registers a new data source with the prompt manager.

        Args:
            data_source (DataSource): Data source to add.

        Returns:
            PromptManager: The prompt manager for chaining.

        Raises:
            ApplicationError: If a data source with the same name already exists.
        """
        if data_source.name in self._data_sources:
            raise ApplicationError(f"DataSource '{data_source.name}' already exists.")
        self._data_sources[data_source.name] = data_source
        return self

    def get_data_source(self, name: str) -> DataSource:
        """
        Looks up a data source by name.

        Args:
            name (str): Name of the data source to lookup.

        Returns:
            DataSource: The data source.

        Raises:
            ApplicationError: If the data source is not found.
        """
        if name not in self._data_sources:
            raise ApplicationError(f"DataSource '{name}' not found.")
        return self._data_sources[name]

    def has_data_source(self, name: str) -> bool:
        """
        Checks for the existence of a named data source.

        Args:
            name (str): Name of the data source to lookup.

        Returns:
            bool: True if the data source exists, False otherwise.
        """
        return name in self._data_sources

    def add_function(self, name: str, function: PromptFunction) -> "PromptManager":
        """
        Registers a new prompt template function with the prompt manager.

        Args:
            name (str): Name of the function to add.
            fn (PromptFunction): Function to add.

        Returns:
            PromptManager: The prompt manager for chaining.

        Raises:
            ApplicationError: If a function with the same name already exists.
        """
        if name in self._functions:
            raise ApplicationError(f"Function '{name}' already exists.")
        self._functions[name] = function
        return self

    def get_function(self, name: str) -> PromptFunction:
        """
        Looks up a prompt template function by name.

        Args:
            name (str): Name of the function to lookup.

        Returns:
            PromptFunction: The function.

        Raises:
            ApplicationError: If the function is not found.
        """
        if name not in self._functions:
            raise ApplicationError(f"Function '{name}' not found.")
        return self._functions[name]

    def has_function(self, name: str) -> bool:
        """
        Checks for the existence of a named prompt template function.

        Args:
            name (str): Name of the function to lookup.

        Returns:
            bool: True if the function exists, False otherwise.
        """
        return name in self._functions

    async def invoke_function(
        self,
        name: str,
        context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        args: List[str],
    ) -> Any:
        """
        Invokes a prompt template function by name.

        Args:
            name (str): Name of the function to invoke.
            context (TurnContext): Turn context for the current turn of conversation with the user.
            memory (MemoryBase): An interface for accessing state values.
            tokenizer (Tokenizer): Tokenizer to use when rendering the prompt.
            args (List[str]): Arguments to pass to the function.

        Returns:
            Any: Value returned by the function.
        """
        function = self.get_function(name)
        return await function(context, memory, self, tokenizer, args)

    def add_prompt(self, prompt: PromptTemplate) -> "PromptManager":
        """
        Registers a new prompt template with the prompt manager.

        Args:
            prompt (PromptTemplate): Prompt template to add.

        Returns:
            PromptManager: The prompt manager for chaining.

        Raises:
            ApplicationError: If a prompt with the same name already exists.
        """
        if prompt.name in self._prompts:
            raise ApplicationError(
                "The PromptManager.add_prompt() method was called with a "
                f"previously registered prompt named '{prompt.name}'."
            )

        # Clone and cache prompt
        self._prompts[prompt.name] = deepcopy(prompt)
        return self

    async def get_prompt(self, name: str) -> PromptTemplate:
        """
        Loads a named prompt template from the filesystem.

        The template will be pre-parsed and cached for use when the template is rendered by name.

        Any augmentations will also be added to the template.

        Args:
            name (str): Name of the prompt to load.

        Returns:
            PromptTemplate: The loaded and parsed prompt template.

        Raises:
            ApplicationError: If the prompt is not found or there is an error loading it.
        """
        if name not in self._prompts:
            template_name = name

            # Load template from disk
            folder = os.path.join(self._options.prompts_folder, name)
            config_file = os.path.join(folder, "config.json")
            prompt_file = os.path.join(folder, "skprompt.txt")
            actions_file = os.path.join(folder, "actions.json")

            # Load prompt config
            try:
                with open(config_file, "r", encoding="utf-8") as file:
                    template_config = PromptTemplateConfig.from_dict(json.load(file))
            except Exception as e:
                raise ApplicationError(
                    "PromptManager.get_prompt(): an error occurred while loading "
                    f"'{config_file}'. The file is either invalid or missing."
                ) from e

            # Load prompt text
            sections: List[PromptSection] = []
            try:
                with open(prompt_file, "r", encoding="utf-8") as file:
                    prompt = file.read()
                    sections.append(TemplateSection(prompt, self._options.role))
            except Exception as e:
                raise ApplicationError(
                    "PromptManager.get_prompt(): an error occurred while loading "
                    f"'{prompt_file}'. The file is either invalid or missing."
                ) from e

            # Load optional actions
            template_actions: List[ChatCompletionAction] = []
            try:
                with open(actions_file, "r", encoding="utf-8") as file:
                    actions = json.load(file)

                    for action in actions:
                        template_actions.append(ChatCompletionAction.from_dict(action))
            except IOError:
                # Ignore missing actions file
                pass

            # Migrate the templates config as needed
            self._update_config(template_config)

            # Add augmentations
            augmentation = self._append_augmentations(
                name, template_config, template_actions, sections
            )

            # Group everything into a system message
            sections = [GroupSection(sections, "system")]

            # Include conversation history
            # - The ConversationHistory section will use the remaining tokens from
            #   max_input_tokens.
            if template_config.completion.include_history:
                sections.append(
                    ConversationHistorySection(
                        f"conversation.{template_name}_history",
                        self._options.max_conversation_history_tokens,
                    )
                )

            # Include user input
            if template_config.completion.include_images:
                sections.append(UserInputMessage(self._options.max_input_tokens))
            elif template_config.completion.include_input:
                sections.append(UserMessage("{{$temp.input}}", self._options.max_input_tokens))

            template = PromptTemplate(
                template_name, Prompt(sections), template_config, template_actions
            )

            if augmentation:
                template.augmentation = augmentation

            # Cache loaded template
            self._prompts[name] = template

        return self._prompts[name]

    def has_prompt(self, name: str) -> bool:
        """
        Checks for the existence of a named prompt.

        Args:
            name (str): Name of the prompt to check.

        Returns:
            bool: True if the prompt exists, False otherwise.
        """
        if name not in self._prompts:
            folder = os.path.join(self._options.prompts_folder, name)
            prompt_file = os.path.join(folder, "skprompt.txt")

            return Path(prompt_file).exists()
        return True

    def _update_config(self, template_config: PromptTemplateConfig):
        # Migrate old schema
        if template_config.schema == 1:
            template_config.schema = 1.1
            if (
                template_config.default_backends is not None
                and len(template_config.default_backends) > 0
            ):
                template_config.completion.model = template_config.default_backends[0]

    def _append_augmentations(
        self,
        name: str,
        template_config: PromptTemplateConfig,
        template_actions: List[ChatCompletionAction],
        sections: List[PromptSection],
    ) -> Optional[teams.ai.augmentations.Augmentation]:
        # Check for augmentation
        augmentation = template_config.augmentation
        if augmentation:
            # First append data sources
            # - We're using a minimum of 2 tokens for each data source to prevent
            # any sort of prompt rendering conflicts between sources and conversation history.
            # - If we wanted to let users specify a percentage% for a data source we would need
            # to track the percentage they gave the data source(s) and give the remaining to
            # the ConversationHistory section.
            data_sources = augmentation.data_sources if augmentation.data_sources else {}
            for source in data_sources:
                if not self.has_data_source(source):
                    raise ApplicationError(f"DataSource '{source}' not found for prompt '{name}.")
                data_source = self.get_data_source(source)
                tokens = max(data_sources[source], 2)
                sections.append(DataSourceSection(data_source, tokens))

            # Next, create augmentation
            augmentation_type = augmentation.augmentation_type
            curr_augmentation: Optional[teams.ai.augmentations.Augmentation] = None

            # Parse the dict objects into ChatCompletionAction objects
            parsed_actions: List[ChatCompletionAction] = []
            if template_actions:
                for action in template_actions:
                    parsed_actions.append(ChatCompletionAction.from_dict(action.to_dict()))

            curr_actions = parsed_actions if template_actions else []
            if augmentation_type == "monologue":
                curr_augmentation = teams.ai.augmentations.MonologueAugmentation(curr_actions)
            elif augmentation_type == "sequence":
                curr_augmentation = teams.ai.augmentations.SequenceAugmentation(curr_actions)

            # Append the augmentations prompt section
            if curr_augmentation:
                section = curr_augmentation.create_prompt_section()
                if section:
                    sections.append(section)

            return curr_augmentation
        return None
