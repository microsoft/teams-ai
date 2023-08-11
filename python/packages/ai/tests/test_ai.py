"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any
from unittest import TestCase

from botbuilder.core import TurnContext

from teams.ai import AI, ActionEntry, AIError, TurnState


class TestAI(TestCase):
    def test_action_method(self):
        ai = AI()

        async def hello_world(_context: TurnContext, _state: TurnState, _entities: Any, _name: str):
            print("test")
            return True

        ai.action("hello_world")(hello_world)

        self.assertIsNotNone(ai._actions["hello_world"])
        self.assertIsInstance(ai._actions["hello_world"], ActionEntry)

    def test_action_decorator(self):
        ai = AI()

        @ai.action("hello_world")
        async def hello_world(_context: TurnContext, _state: TurnState, _entities: Any, _name: str):
            print("test")
            return True

        self.assertIsNotNone(ai._actions["hello_world"])
        self.assertIsInstance(ai._actions["hello_world"], ActionEntry)

    def test_action_default_name(self):
        ai = AI()

        @ai.action()
        async def hello_world(_context: TurnContext, _state: TurnState, _entities: Any, _name: str):
            print("test")
            return True

        self.assertIsNotNone(ai._actions["hello_world"])
        self.assertIsInstance(ai._actions["hello_world"], ActionEntry)

    def test_action_method_override(self):
        ai = AI()

        @ai.action()
        async def hello_world(_context: TurnContext, _state: TurnState, _entities: Any, _name: str):
            print("test")
            return True

        def wrapper():
            ai.action()(hello_world)

        self.assertRaises(AIError, wrapper)
