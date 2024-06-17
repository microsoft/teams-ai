"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import datetime
import json
from unittest import TestCase

import yaml

from teams.ai.tokenizers.gpt_tokenizer import GPTTokenizer
from teams.utils import to_string


class TestToString(TestCase):
    def setUp(self):
        self.tokenizer = GPTTokenizer()

    def test_to_string_with_none(self):
        self.assertEqual(to_string(self.tokenizer, None), "")

    def test_to_string_with_string(self):
        self.assertEqual(to_string(self.tokenizer, "test"), '"test"')

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
