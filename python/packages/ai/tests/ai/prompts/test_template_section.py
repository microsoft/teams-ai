"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import AsyncMock, MagicMock

from botbuilder.core import MemoryStorage, TurnContext

from teams.ai.prompts import PromptFunctions, TemplateSection
from teams.ai.tokenizers import GPTTokenizer
from teams.app_error import ApplicationError
from teams.state import ConversationState, TempState, TurnState, UserState


class TestTemplateSection(IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.context = MagicMock(spec=TurnContext)
        self.context.activity.channel_id = "channel_id"
        self.context.activity.recipient.id = "bot_id"
        self.context.activity.conversation.id = "conversation_id"
        self.context.activity.from_property.id = "user_id"

        memory_storage = MemoryStorage()
        self.memory = await TurnState[ConversationState, UserState, TempState].load(
            self.context, memory_storage
        )
        self.memory.conversation["test_property"] = "conversation_test_value"
        self.memory.user["test_property"] = "user_test_value"
        self.memory.temp.input = "temp_input"

        self.functions = MagicMock(spec=PromptFunctions)
        mock_invoke_function = AsyncMock()
        mock_invoke_function.return_value = "test_func"
        self.functions.invoke_function = mock_invoke_function
        self.tokenizer = GPTTokenizer()

    async def test_init(self):
        template_section = TemplateSection("template", "user")
        self.assertEqual(template_section.template, "template")
        self.assertEqual(template_section.role, "user")
        self.assertEqual(template_section.tokens, -1)
        self.assertTrue(template_section.required)
        self.assertEqual(template_section.separator, "\n")
        self.assertEqual(template_section.text_prefix, "")

    async def test_init_with_optional_params(self):
        template_section = TemplateSection("template", "user", 10, False, " ", "text_prefix")
        self.assertEqual(template_section.template, "template")
        self.assertEqual(template_section.role, "user")
        self.assertEqual(template_section.tokens, 10)
        self.assertFalse(template_section.required)
        self.assertEqual(template_section.separator, " ")
        self.assertEqual(template_section.text_prefix, "text_prefix")

    async def test_init_with_missing_brace(self):
        with self.assertRaises(ApplicationError) as context:
            TemplateSection("Hello {{test_func}", "user")  # missing closing brace
        self.assertEqual(str(context.exception), "Invalid template: Hello {{test_func}")

    async def test_init_with_with_unclosed_function_arg(self):
        with self.assertRaises(ApplicationError) as context:
            TemplateSection("Hello {{test_func 'arg1}}", "role")
        self.assertEqual(str(context.exception), "Invalid template: Hello {{test_func 'arg1}}")

    async def test_render_as_messages(self):
        template_section = TemplateSection("Hello World", "role")
        result = await template_section.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 10
        )
        self.assertEqual(result.output[0].role, "role")
        self.assertEqual(result.output[0].content, "Hello World")
        self.assertFalse(result.too_long)
        self.assertEqual(result.length, 2)

    async def test_render_as_messages_too_long(self):
        template_section = TemplateSection("Hello World", "role")
        result = await template_section.render_as_messages(
            self.context, self.memory, self.functions, self.tokenizer, 1
        )
        self.assertEqual(result.output[0].role, "role")
        self.assertEqual(result.output[0].content, "Hello World")
        self.assertTrue(result.too_long)
        self.assertEqual(result.length, 2)

    async def test_render_as_text(self):
        template_section = TemplateSection("Hello World", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 10
        )
        self.assertEqual(result.output, "Hello World")
        self.assertFalse(result.too_long)
        self.assertEqual(result.length, 2)

    async def test_render_as_text_too_long(self):
        template_section = TemplateSection("Hello World", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 1
        )
        self.assertEqual(result.output, "Hello World")
        self.assertTrue(result.too_long)
        self.assertEqual(result.length, 2)

    async def test_render_variable(self):
        template_section = TemplateSection(
            "Hello {{$user.test_property}} {{$conversation.test_property}} {{$temp.input}}", "role"
        )
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.output, "Hello user_test_value conversation_test_value temp_input")
        self.assertEqual(result.length, 9)
        self.assertFalse(result.too_long)

    async def test_render_variable_with_whitespace(self):
        template_section = TemplateSection(
            "Hello {{ $user.test_property }} {{ $conversation.test_property }} {{ $temp.input }}",
            "role",
        )
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.output, "Hello user_test_value conversation_test_value temp_input")
        self.assertEqual(result.length, 9)
        self.assertFalse(result.too_long)

    async def test_render_non_exist_variable(self):
        template_section = TemplateSection("Hello {{$user.non_exist}}", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.output, "Hello ")
        self.assertEqual(result.length, 2)
        self.assertFalse(result.too_long)

    async def test_render_function(self):
        template_section = TemplateSection("Hello {{test_func}}", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        args, _kwargs = self.functions.invoke_function.call_args
        name_param_value = args[0]
        args_parama_value = args[4]
        self.assertEqual(result.output, "Hello test_func")
        self.assertEqual(name_param_value, "test_func")
        self.assertEqual(args_parama_value, [])
        self.assertEqual(result.length, 3)
        self.assertFalse(result.too_long)

    async def test_render_function_with_args(self):
        template_section = TemplateSection("Hello {{test_func arg1 arg2}}", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        args, _kwargs = self.functions.invoke_function.call_args
        name_param_value = args[0]
        args_parama_value = args[4]
        self.assertEqual(result.output, "Hello test_func")
        self.assertEqual(name_param_value, "test_func")
        self.assertEqual(args_parama_value, ["arg1", "arg2"])
        self.assertEqual(result.length, 3)
        self.assertFalse(result.too_long)

    async def test_render_function_with_args_and_whitespaces(self):
        template_section = TemplateSection("Hello {{ test_func arg1 arg2 }}", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        args, _kwargs = self.functions.invoke_function.call_args
        name_param_value = args[0]
        args_parama_value = args[4]
        self.assertEqual(result.output, "Hello test_func")
        self.assertEqual(name_param_value, "test_func")
        self.assertEqual(args_parama_value, ["arg1", "arg2"])
        self.assertEqual(result.length, 3)
        self.assertFalse(result.too_long)

    async def test_render_function_with_quoted_args(self):
        template_section = TemplateSection("Hello {{ test_func 'arg1' \"arg2\" `arg3` }}", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        args, _kwargs = self.functions.invoke_function.call_args
        name_param_value = args[0]
        args_parama_value = args[4]
        self.assertEqual(result.output, "Hello test_func")
        self.assertEqual(name_param_value, "test_func")
        self.assertEqual(args_parama_value, ["arg1", "arg2", "arg3"])
        self.assertEqual(result.length, 3)
        self.assertFalse(result.too_long)

    async def test_render_empty_block(self):
        template_section = TemplateSection("Hello {{}}", "role")
        result = await template_section.render_as_text(
            self.context, self.memory, self.functions, self.tokenizer, 100
        )
        self.assertEqual(result.output, "Hello ")
        self.assertEqual(result.length, 2)
        self.assertFalse(result.too_long)
