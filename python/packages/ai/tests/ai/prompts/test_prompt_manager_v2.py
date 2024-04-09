"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import os
from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from teams.ai.data_sources import TextDataSource
from teams.ai.prompts import (
    ConversationHistorySection,
    GroupSection,
    Prompt,
    PromptFunction,
    PromptManager,
    PromptManagerOptions,
    PromptTemplate,
    TemplateSection,
    UserInputMessage,
    UserMessage,
)
from teams.ai.prompts.sections import ActionAugmentationSection
from teams.ai.prompts.sections.data_source_section import DataSourceSection
from teams.app_error import ApplicationError

TEST_ASSERTS_FOLDER: str = os.path.join("tests", "ai", "prompts", "test_assets")


class TestPromptManager(IsolatedAsyncioTestCase):
    def setUp(self):
        self.options = PromptManagerOptions(TEST_ASSERTS_FOLDER)
        self.prompt_manager = PromptManager(self.options)

    def test_add_and_get_data_source(self):
        data_source = TextDataSource("test_name", "test_text")
        self.prompt_manager.add_data_source(data_source)
        self.assertTrue(self.prompt_manager.has_data_source("test_name"))
        self.assertEqual(self.prompt_manager.get_data_source("test_name"), data_source)

    def test_add_data_source_duplicate(self):
        data_source = TextDataSource("test_name", "test_text")
        self.prompt_manager.add_data_source(data_source)
        with self.assertRaises(ApplicationError) as context:
            self.prompt_manager.add_data_source(data_source)
        self.assertEqual(str(context.exception), "DataSource 'test_name' already exists.")

    def test_get_data_source_not_found(self):
        with self.assertRaises(ApplicationError) as context:
            self.prompt_manager.get_data_source("not_exist")
        self.assertEqual(str(context.exception), "DataSource 'not_exist' not found.")

    def test_add_and_get_function(self):
        function = MagicMock(spec=PromptFunction)
        self.prompt_manager.add_function("test_name", function)
        self.assertTrue(self.prompt_manager.has_function("test_name"))
        self.assertEqual(self.prompt_manager.get_function("test_name"), function)

    def test_add_function_duplicate(self):
        function = MagicMock(spec=PromptFunction)
        self.prompt_manager.add_function("test_name", function)
        with self.assertRaises(ApplicationError) as context:
            self.prompt_manager.add_function("test_name", function)
        self.assertEqual(str(context.exception), "Function 'test_name' already exists.")

    def test_get_function_not_found(self):
        with self.assertRaises(ApplicationError) as context:
            self.prompt_manager.get_function("not_exist")
        self.assertEqual(str(context.exception), "Function 'not_exist' not found.")

    async def test_add_and_get_prompt(self):
        prompt = MagicMock(spec=PromptTemplate)
        prompt.name = "test"
        self.prompt_manager.add_prompt(prompt)
        self.assertTrue(self.prompt_manager.has_prompt("test"))

    def test_add_prompt_duplicate(self):
        prompt = MagicMock(spec=PromptTemplate)
        prompt.name = "test"
        self.prompt_manager.add_prompt(prompt)
        with self.assertRaises(ApplicationError) as context:
            self.prompt_manager.add_prompt(prompt)
        self.assertEqual(
            str(context.exception),
            "The PromptManager.add_prompt() method was called with a "
            "previously registered prompt named 'test'.",
        )

    def test_has_prompt_from_file(self):
        self.assertTrue(self.prompt_manager.has_prompt("happy_path"))

    def test_has_prompt_not_found(self):
        self.assertFalse(self.prompt_manager.has_prompt("not_found"))

    async def test_get_prompt_from_file_no_config(self):
        with self.assertRaises(ApplicationError) as context:
            await self.prompt_manager.get_prompt("no_config")
        self.assertEqual(
            str(context.exception),
            "PromptManager.get_prompt(): an error occurred while loading '"
            + os.path.join(TEST_ASSERTS_FOLDER, "no_config", "config.json")
            + "'. The file is either invalid or missing.",
        )

    async def test_get_prompt_from_file_no_prompt(self):
        with self.assertRaises(ApplicationError) as context:
            await self.prompt_manager.get_prompt("no_prompt")
        self.assertEqual(
            str(context.exception),
            "PromptManager.get_prompt(): an error occurred while loading '"
            + os.path.join(TEST_ASSERTS_FOLDER, "no_prompt", "skprompt.txt")
            + "'. The file is either invalid or missing.",
        )

    async def test_get_prompt_from_file(self):
        self.prompt_manager.add_data_source(TextDataSource("teams-ai", "test_text"))
        prompt = await self.prompt_manager.get_prompt("happy_path")

        self.assertEqual(prompt.name, "happy_path")
        assert isinstance(prompt.prompt, Prompt)
        self.assertEqual(len(prompt.prompt.sections), 3)
        assert isinstance(prompt.prompt.sections[0], GroupSection)
        self.assertEqual(len(prompt.prompt.sections[0].sections), 3)
        assert isinstance(prompt.prompt.sections[0].sections[0], TemplateSection)
        self.assertEqual(prompt.prompt.sections[0].sections[0].template, "test prompt")
        assert isinstance(prompt.prompt.sections[0].sections[1], DataSourceSection)
        assert isinstance(prompt.prompt.sections[0].sections[2], ActionAugmentationSection)
        self.assertEqual(len(prompt.prompt.sections[0].sections[2].actions.keys()), 3)
        actions = prompt.prompt.sections[0].sections[2].actions
        self.assertEqual(actions.get("createList").name, "createList")  # type: ignore[union-attr]
        self.assertEqual(
            actions.get("createList").description,  # type: ignore[union-attr]
            "Creates a new list with an optional set of initial items",
        )
        assert isinstance(prompt.prompt.sections[1], ConversationHistorySection)
        self.assertEqual(prompt.prompt.sections[1].variable, "conversation.happy_path_history")
        self.assertEqual(
            prompt.prompt.sections[1].tokens, self.options.max_conversation_history_tokens
        )
        assert isinstance(prompt.prompt.sections[2], UserMessage)
        self.assertEqual(prompt.prompt.sections[2].template, "{{$temp.input}}")
        self.assertEqual(prompt.prompt.sections[2].tokens, self.options.max_input_tokens)

        self.assertEqual(prompt.config.schema, 1.1)
        self.assertEqual(prompt.config.description, "test config")
        self.assertEqual(prompt.config.type, "completion")
        self.assertEqual(prompt.config.completion.model, "gpt-3.5-turbo")
        self.assertEqual(prompt.config.completion.completion_type, "chat")
        self.assertEqual(prompt.config.completion.include_history, True)
        self.assertEqual(prompt.config.completion.include_input, True)
        self.assertEqual(prompt.config.completion.max_input_tokens, 2800)
        self.assertEqual(prompt.config.completion.max_tokens, 1000)
        self.assertEqual(prompt.config.completion.temperature, 0.9)
        self.assertEqual(prompt.config.completion.top_p, 0.0)
        self.assertEqual(prompt.config.completion.presence_penalty, 0.6)
        self.assertEqual(prompt.config.completion.frequency_penalty, 0.0)
        self.assertEqual(prompt.config.completion.stop_sequences, [])
        augmentation = prompt.config.augmentation
        self.assertEqual(augmentation.augmentation_type, "monologue")  # type: ignore[union-attr]
        self.assertEqual(
            augmentation.data_sources.get("teams-ai"), 1200  # type: ignore[union-attr]
        )

    async def test_get_prompt_from_file_include_images(self):
        self.prompt_manager.add_data_source(TextDataSource("teams-ai", "test_text"))
        prompt = await self.prompt_manager.get_prompt("include_images")

        self.assertEqual(prompt.name, "include_images")
        assert isinstance(prompt.prompt, Prompt)
        self.assertEqual(len(prompt.prompt.sections), 3)
        assert isinstance(prompt.prompt.sections[0], GroupSection)
        self.assertEqual(len(prompt.prompt.sections[0].sections), 2)
        assert isinstance(prompt.prompt.sections[0].sections[0], TemplateSection)
        self.assertEqual(prompt.prompt.sections[0].sections[0].template, "test prompt")
        assert isinstance(prompt.prompt.sections[0].sections[1], DataSourceSection)
        assert isinstance(prompt.prompt.sections[1], ConversationHistorySection)
        self.assertEqual(prompt.prompt.sections[1].variable, "conversation.include_images_history")
        self.assertEqual(
            prompt.prompt.sections[1].tokens, self.options.max_conversation_history_tokens
        )
        assert isinstance(prompt.prompt.sections[2], UserInputMessage)
        self.assertEqual(prompt.prompt.sections[2].tokens, self.options.max_input_tokens)
        augmentation = prompt.config.augmentation
        self.assertEqual(augmentation.augmentation_type, "none")  # type: ignore[union-attr]
        self.assertEqual(
            augmentation.data_sources.get("teams-ai"), 1200  # type: ignore[union-attr]
        )

    async def test_get_prompt_from_file_migrate_old_schema(self):
        prompt = await self.prompt_manager.get_prompt("migrate_old_schema")

        self.assertEqual(prompt.config.schema, 1.1)
        self.assertEqual(prompt.config.completion.model, "gpt-3.5-turbo")
