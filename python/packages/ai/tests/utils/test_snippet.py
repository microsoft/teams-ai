"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.utils import snippet


class TestSnippet(TestCase):
    def test_snippet(self):
        text = "This is a test snippet"
        self.assertEqual(snippet(text, 10), "This is a...")
        self.assertEqual(snippet(text, 100), text)
        hello = "hello world"
        self.assertEqual(snippet(hello, 5), "hell...")
        self.assertEqual(snippet(hello, 6), "hello...")
