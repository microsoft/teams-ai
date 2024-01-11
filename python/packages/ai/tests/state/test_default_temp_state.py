"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.state import DefaultTempState
from teams import InputFile

class TestDefaultTempState(TestCase):
    def setUp(self):
        self.data = {
            DefaultTempState.INPUT: "test input",
            DefaultTempState.INPUT_FILES: [InputFile("test_file", "test_path", "test_url")],
            DefaultTempState.LAST_OUTPUT: "test output",
            DefaultTempState.ACTION_OUTPUTS: {"action1": "output1"},
            DefaultTempState.AUTH_TOKENS: {"token1": "auth1"},
            DefaultTempState.DUPLICATE_TOKEN_EXCHANGE: True
        }
        self.temp_state = DefaultTempState(self.data)

    def test_input(self):
        self.assertEqual(self.temp_state.input, "test input")
        self.temp_state.input = "new input"
        self.assertEqual(self.temp_state.input, "new input")

    def test_input_files(self):
        self.assertEqual(self.temp_state.input_files, [InputFile("test_file", "test_path", "test_url")])
        new_files = [InputFile("new_file", "new_path", "new_url")]
        self.temp_state.input_files = new_files
        self.assertEqual(self.temp_state.input_files, new_files)

    def test_last_output(self):
        self.assertEqual(self.temp_state.last_output, "test output")
        self.temp_state.last_output = "new output"
        self.assertEqual(self.temp_state.last_output, "new output")

    def test_action_outputs(self):
        self.assertEqual(self.temp_state.action_outputs, {"action1": "output1"})
        new_outputs = {"action2": "output2"}
        self.temp_state.action_outputs = new_outputs
        self.assertEqual(self.temp_state.action_outputs, new_outputs)

    def test_auth_tokens(self):
        self.assertEqual(self.temp_state.auth_tokens, {"token1": "auth1"})
        new_tokens = {"token2": "auth2"}
        self.temp_state.auth_tokens = new_tokens
        self.assertEqual(self.temp_state.auth_tokens, new_tokens)

    def test_duplicate_token_exchange(self):
        self.assertEqual(self.temp_state.duplicate_token_exchange, True)
        self.temp_state.duplicate_token_exchange = False
        self.assertEqual(self.temp_state.duplicate_token_exchange, False)

    def test_get_dict(self):
        self.assertEqual(self.temp_state.get_dict(), self.data)