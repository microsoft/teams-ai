"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
import os
from typing import cast
from unittest import IsolatedAsyncioTestCase

import pytest
from botbuilder.core import TurnContext

from teams.ai.prompts import PromptManager, PromptTemplate, PromptTemplateConfig
from teams.ai.state import (
    ConversationState,
    TempState,
    TurnState,
    TurnStateEntry,
    UserState,
)

TEST_ASSERTS_FOLDER: str = "tests/prompts/test_assets"


class TestDefaultPromptManager(IsolatedAsyncioTestCase):
    def test_add_function(self):
        def function_to_add_1(turn_context: TurnContext, turn_state: TurnState) -> str:
            raise NotImplementedError()

        def function_to_add_2(turn_context: TurnContext, turn_state: TurnState) -> str:
            raise NotImplementedError()

        prompt_manager = PromptManager(TEST_ASSERTS_FOLDER)

        # add function success when name is not taken
        prompt_manager.add_function("test_function_1", function_to_add_1)
        self.assertEqual(prompt_manager._functions.get("test_function_1"), function_to_add_1)

        prompt_manager.add_function("test_function_2", function_to_add_2)
        self.assertEqual(prompt_manager._functions.get("test_function_2"), function_to_add_2)

        # add function fails when name is taken
        with pytest.raises(Exception):
            prompt_manager.add_function("test_function_1", function_to_add_1)

    @pytest.mark.asyncio
    async def test_render_prompt(self):
        prompt_manager = PromptManager(TEST_ASSERTS_FOLDER)
        mocked_turn_context = self._mock_turn_context()
        mocked_turn_state = self._mock_turn_state()

        # render prompt success when template is passed
        prompt = await prompt_manager.render_prompt(
            mocked_turn_context, mocked_turn_state, "happy_path"
        )
        self.assertEqual(prompt.text, "test prompt")

        # render prompt success when template is passed
        with open(
            os.path.join(TEST_ASSERTS_FOLDER, "happy_path", "config.json"), "r", encoding="utf8"
        ) as file:
            prompt_template = PromptTemplate(
                "test prompt", PromptTemplateConfig.from_dict(json.loads(file.read()))
            )
            prompt = await prompt_manager.render_prompt(
                mocked_turn_context, mocked_turn_state, prompt_template
            )
            self.assertEqual(prompt.text, "test prompt")

        # render prompt fail when config file is missing
        with pytest.raises(Exception):
            await prompt_manager.render_prompt(
                mocked_turn_context, mocked_turn_state, "missing_config"
            )

        # render prompt fail when prompt file is missing
        with pytest.raises(Exception):
            await prompt_manager.render_prompt(
                mocked_turn_context, mocked_turn_state, "missing_prompt"
            )

    def _mock_turn_context(self) -> TurnContext:
        return cast(TurnContext, {})

    def _mock_turn_state(self) -> TurnState:
        conversation_state = ConversationState()
        user_state = UserState()
        temp_state = TempState("input", "history", "output")
        turn_state = TurnState[ConversationState, UserState, TempState](
            conversation=TurnStateEntry(conversation_state),
            user=TurnStateEntry(user_state),
            temp=TurnStateEntry(temp_state),
        )
        return turn_state
