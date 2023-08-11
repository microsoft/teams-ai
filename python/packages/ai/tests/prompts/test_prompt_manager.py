"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase

import pytest
from botbuilder.core import TurnContext
from semantic_kernel import Kernel, PromptTemplate, PromptTemplateConfig

from teams.ai.prompts import PromptManager
from teams.ai.state import (
    ConversationState,
    TempState,
    TurnState,
    TurnStateEntry,
    UserState,
)
from tests.utils import ACTIVITY, SimpleAdapter

TEST_ASSERTS_FOLDER = "tests/prompts/test_assets"


class TestDefaultPromptManager(IsolatedAsyncioTestCase):
    def test_add_function(self):
        async def function_to_add(_context: TurnContext, _state: TurnState):
            pass

        prompt_manager = PromptManager[TurnState[ConversationState, UserState, TempState]](
            TEST_ASSERTS_FOLDER
        )

        # add function success when name is not taken
        prompt_manager.add_function("test_function", function_to_add)
        self.assertEqual(prompt_manager._functions.get("test_function"), function_to_add)

        # add function fails when name is taken
        with pytest.raises(Exception):
            prompt_manager.add_function("test_function", function_to_add)

    @pytest.mark.asyncio
    async def test_render_prompt(self):
        prompt_manager = PromptManager(TEST_ASSERTS_FOLDER)
        mocked_turn_context = self._mock_turn_context()
        mocked_turn_state = self._mock_turn_state()

        # render prompt success when template is passed
        prompt = await prompt_manager.render_prompt(
            mocked_turn_context, mocked_turn_state, "happy_path"
        )
        self.assertEqual(prompt._template, "test prompt")

        # render prompt success when template is passed
        sk = Kernel()
        prompt_template = PromptTemplate(
            "test prompt", sk.prompt_template_engine, PromptTemplateConfig()
        )
        prompt = await prompt_manager.render_prompt(
            mocked_turn_context, mocked_turn_state, prompt_template
        )
        self.assertEqual(prompt._template, "test prompt")

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
        return TurnContext(adapter_or_context=SimpleAdapter(), request=ACTIVITY)

    def _mock_turn_state(self) -> TurnState:
        return TurnState(
            conversation=TurnStateEntry(ConversationState()),
            user=TurnStateEntry(UserState()),
            temp=TurnStateEntry(TempState(history="", input="", output="")),
        )
