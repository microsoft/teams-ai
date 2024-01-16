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
        text = "tiktoken is great!"
        expected_result = [83, 1609, 5963, 374, 2294, 0]
        result = self.tokenizer.encode(text)
        self.assertEqual(
            result, expected_result, "Expected result does not match the encoded result"
        )

    def test_decode(self):
        tokens = [83, 1609, 5963, 374, 2294, 0]
        expected_result = "tiktoken is great!"
        result = self.tokenizer.decode(tokens)
        self.assertEqual(
            result, expected_result, "Expected result does not match the decoded result"
        )
