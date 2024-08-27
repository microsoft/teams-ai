"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams.ai.prompts import PromptFunctions
from teams.ai.prompts.action_output_message import ActionOutputMessage
from teams.ai.prompts.message import ActionCall, ActionFunction, Message
from teams.ai.tokenizers import GPTTokenizer
from teams.state import ConversationState, TempState, TurnState, UserState


class TestActionOutputMessage(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.context = MagicMock(spec=TurnContext)
        self.memory = await TurnState[ConversationState, UserState, TempState].load(self.context)
        self.functions = MagicMock(spec=PromptFunctions)
        self.tokenizer = GPTTokenizer()
        await self.memory.load(self.context)

    def test_init_default(self):
        message = ActionOutputMessage("conversation.tools_history")
        self.assertEqual(message.tokens, -1)
        self.assertEqual(message._history_variable, "conversation.tools_history")
        self.assertEqual(message._output_variable, "temp.action_outputs")

    async def test_render_as_messages_no_history(self):
        message = ActionOutputMessage("conversation.tools_history")
        self.memory.conversation.tools_history = []

        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.length, 0)
        self.assertEqual(len(result.output), 0)
        self.assertFalse(result.too_long)

    async def test_render_as_messages_with_history_and_outputs(self):
        message = ActionOutputMessage("conversation.tools_history")
        self.memory.conversation.tools_history = [
            Message(role="user", content="Turn the lights on"),
            Message(
                role="assistant",
                action_calls=[
                    ActionCall(
                        id="test_tool_1",
                        type="function",
                        function=ActionFunction(name="tool_one", arguments="{}"),
                    )
                ],
            ),
        ]
        self.memory.temp.action_outputs = {"test_tool_1": "hello"}

        result = await message.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.length, 1)
        self.assertEqual(len(result.output), 1)
        self.assertEqual(result.output[0].role, "tool")
        self.assertEqual(result.output[0].action_call_id, "test_tool_1")
        self.assertEqual(result.output[0].content, "hello")
        self.assertFalse(result.too_long)
