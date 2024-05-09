"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import datetime
import json
from unittest import TestCase

import yaml

from teams.ai.citations.citations import Appearance, ClientCitation
from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.ai.utilities import (
    format_citations_response,
    get_used_citations,
    snippet,
    to_string,
)


class TestUtilities(TestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()

    def test_to_string_with_none(self):
        self.assertEqual(to_string(self.tokenizer, None), "")

    def test_to_string_with_string(self):
        self.assertEqual(to_string(self.tokenizer, "test"), "test")

    def test_to_string_with_number(self):
        self.assertEqual(to_string(self.tokenizer, 123), "123")

    def test_to_string_with_datetime(self):
        current_time = datetime.datetime.now()
        self.assertEqual(to_string(self.tokenizer, current_time), current_time.isoformat())

    def test_to_string_with_object(self):
        obj = {"key": "value", "key2": [1, 2, 3]}
        yaml_str = yaml.dump(obj)
        json_str = json.dumps(obj)
        expected = (
            yaml_str
            if len(self.tokenizer.encode(yaml_str)) < len(self.tokenizer.encode(json_str))
            else json_str
        )
        self.assertEqual(to_string(self.tokenizer, obj), expected)

    def test_to_string_with_object_as_json(self):
        obj = {"key": "value", "key2": [1, 2, 3]}
        self.assertEqual(to_string(self.tokenizer, obj, as_json=True), json.dumps(obj))

    def test_snippet(self):
        text = "This is a test snippet"
        self.assertEqual(snippet(text, 10), "This is a...")
        self.assertEqual(snippet(text, 100), text)
        hello = "hello world"
        self.assertEqual(snippet(hello, 5), "hell...")
        self.assertEqual(snippet(hello, 6), "hello...")

    def test_format_citations_response(self):
        result = format_citations_response("hello [doc1] world [docs2]")
        self.assertEqual(result, "hello [1] world [2]")

    def test_get_used_citations(self):
        citations = [
            ClientCitation(
                position="1",
                appearance=Appearance(name="the title", abstract="some citation text..."),
            ),
            ClientCitation(
                position="2",
                appearance=Appearance(name="the title", abstract="some citation other text..."),
            ),
        ]
        text = "hello [1] world"
        result = get_used_citations(text, citations)
        self.assertEqual(len(result), 1)
        self.assertEqual(result, [citations[0]])

    def test_get_used_citations_longer(self):
        citations = [
            ClientCitation(
                position="1",
                appearance=Appearance(name="the title", abstract="some citation text..."),
            ),
            ClientCitation(
                position="2",
                appearance=Appearance(name="the title", abstract="some citation other text..."),
            ),
            ClientCitation(
                position="3",
                appearance=Appearance(name="the title", abstract="some citation text..."),
            ),
            ClientCitation(
                position="4",
                appearance=Appearance(name="the title", abstract="some citation other text..."),
            ),
        ]
        text = "hello [1] world [3]"
        result = get_used_citations(text, citations)
        self.assertEqual(len(result), 2)
        self.assertEqual(result, [citations[0], citations[2]])
