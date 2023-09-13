"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

import pytest
from botbuilder.core import TurnContext

from teams import (
    AI,
    ActionEntry,
    AIOptions,
    ApplicationError,
    OpenAIPlanner,
    OpenAIPlannerOptions,
    TurnState,
)


class TestAI(TestCase):
    ai: AI

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.ai = AI(
            AIOptions(
                OpenAIPlanner(
                    OpenAIPlannerOptions(api_key="test", default_model="text-davinci-003")
                )
            )
        )

        yield

    def test_action_method(self):
        async def hello_world(_context: TurnContext, _state: TurnState):
            print("test")
            return True

        self.ai.action("hello_world")(hello_world)

        self.assertIsNotNone(self.ai._actions["hello_world"])
        self.assertIsInstance(self.ai._actions["hello_world"], ActionEntry)

    def test_action_decorator(self):
        @self.ai.action("hello_world")
        async def hello_world(_context: TurnContext, _state: TurnState):
            print("test")
            return True

        self.assertIsNotNone(self.ai._actions["hello_world"])
        self.assertIsInstance(self.ai._actions["hello_world"], ActionEntry)

    def test_action_default_name(self):
        @self.ai.action()
        async def hello_world(_context: TurnContext, _state: TurnState):
            print("test")
            return True

        self.assertIsNotNone(self.ai._actions["hello_world"])
        self.assertIsInstance(self.ai._actions["hello_world"], ActionEntry)

    def test_action_method_override(self):
        @self.ai.action()
        async def hello_world(_context: TurnContext, _state: TurnState):
            print("test")
            return True

        def wrapper():
            self.ai.action()(hello_world)

        self.assertRaises(ApplicationError, wrapper)
