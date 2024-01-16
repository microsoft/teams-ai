"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import unittest

from teams.ai.tokenizers import GPTTokenizer


class TestGPTTokenizer(unittest.TestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()

    def test_encode(self):
        text = "hello world"
        expected_result = [31373, 995]
        result = self.tokenizer.encode(text)
        self.assertEqual(
            result, expected_result, "Expected result does not match the encoded result"
        )

    def test_decode(self):
        tokens = [31373, 995]
        expected_result = "hello world"
        result = self.tokenizer.decode(tokens)
        self.assertEqual(
            result, expected_result, "Expected result does not match the decoded result"
        )
