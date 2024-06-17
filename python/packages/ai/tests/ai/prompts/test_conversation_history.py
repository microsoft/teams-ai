"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext

from teams.ai.prompts import ConversationHistorySection, Message, PromptFunctions
from teams.ai.tokenizers import GPTTokenizer
from teams.state import ConversationState, TempState, TurnState, UserState


class TestConversationHistory(IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self.prompt_functions = MagicMock(spec=PromptFunctions)
        self.turn_context = MagicMock(spec=TurnContext)
        self.memory = await TurnState[ConversationState, UserState, TempState].load(
            self.turn_context
        )
        self.memory.conversation["history"] = [
            Message("user", "Hello"),
            Message("assistant", "Hi! How can I help you?"),
            Message("user", "I'd like to book a flight"),
            Message("assistant", "Sure, where would you like to go?"),
        ]

    def test_init(self):
        conversation_history = ConversationHistorySection("conversation.history")
        self.assertEqual(conversation_history.tokens, 1.0)
        self.assertFalse(conversation_history.required)
        self.assertEqual(conversation_history.separator, "\n")
        self.assertEqual(conversation_history.user_prefix, "user: ")
        self.assertEqual(conversation_history.assistant_prefix, "assistant: ")

    def test_init_with_optional_params(self):
        conversation_history = ConversationHistorySection(
            "conversation.history",
            tokens=0.5,
            required=True,
            user_prefix="user: ",
            assistant_prefix="assistant: ",
            separator="\n",
        )
        self.assertEqual(conversation_history.tokens, 0.5)
        self.assertTrue(conversation_history.required)
        self.assertEqual(conversation_history.separator, "\n")
        self.assertEqual(conversation_history.user_prefix, "user: ")
        self.assertEqual(conversation_history.assistant_prefix, "assistant: ")

    async def test_render_as_text(self):
        conversation_history = ConversationHistorySection("conversation.history")
        result = await conversation_history.render_as_text(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(
            result.output,
            'user: "Hello"\n'
            'assistant: "Hi! How can I help you?"\n'
            'user: "I\'d like to book a flight"\n'
            'assistant: "Sure, where would you like to go?"',
        )
        self.assertEqual(result.length, 42)
        self.assertFalse(result.too_long)

    async def test_render_as_text_include_initial_line_when_required(self):
        conversation_history = ConversationHistorySection("conversation.history", required=True)
        result = await conversation_history.render_as_text(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 1
        )
        self.assertEqual(result.output, 'assistant: "Sure, where would you like to go?"')
        self.assertEqual(result.length, 12)
        self.assertTrue(result.too_long)

    async def test_render_as_text_truncate_history(self):
        conversation_history = ConversationHistorySection("conversation.history")
        result = await conversation_history.render_as_text(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 12
        )
        self.assertEqual(result.output, 'assistant: "Sure, where would you like to go?"')
        self.assertEqual(result.length, 12)
        self.assertFalse(result.too_long)

    async def test_render_as_text_empty_history(self):
        conversation_history = ConversationHistorySection("conversation.no_history")
        result = await conversation_history.render_as_text(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(result.output, "")
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)

    async def test_render_as_text_long_last_message(self):
        conversation_history = ConversationHistorySection("conversation.history")
        result = await conversation_history.render_as_text(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 1
        )
        self.assertEqual(result.output, "")
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)

    async def test_render_as_messages(self):
        conversation_history = ConversationHistorySection("conversation.history")
        result = await conversation_history.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(
            result.output,
            [
                Message("user", '"Hello"'),
                Message("assistant", '"Hi! How can I help you?"'),
                Message("user", '"I\'d like to book a flight"'),
                Message("assistant", '"Sure, where would you like to go?"'),
            ],
        )
        self.assertEqual(result.length, 30)
        self.assertFalse(result.too_long)

    async def test_render_as_messages_include_initial_line_when_required(self):
        conversation_history = ConversationHistorySection("conversation.history", required=True)
        result = await conversation_history.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 1
        )
        self.assertEqual(
            result.output, [Message("assistant", '"Sure, where would you like to go?"')]
        )
        self.assertEqual(result.length, 10)
        self.assertTrue(result.too_long)

    async def test_render_as_messages_truncate_history(self):
        conversation_history = ConversationHistorySection("conversation.history")
        result = await conversation_history.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 12
        )
        self.assertEqual(
            result.output, [Message("assistant", '"Sure, where would you like to go?"')]
        )
        self.assertEqual(result.length, 10)
        self.assertFalse(result.too_long)

    async def test_render_as_messages_empty_history(self):
        conversation_history = ConversationHistorySection("conversation.no_history")
        result = await conversation_history.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 100
        )
        self.assertEqual(result.output, [])
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)

    async def test_render_as_messages_long_last_message(self):
        conversation_history = ConversationHistorySection("conversation.history")
        result = await conversation_history.render_as_messages(
            self.turn_context, self.memory, self.prompt_functions, GPTTokenizer(), 1
        )
        self.assertEqual(result.output, [])
        self.assertEqual(result.length, 0)
        self.assertFalse(result.too_long)
