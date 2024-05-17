"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.utils.citations import format_citations_response


class TestFormatCitationsResponse(TestCase):
    def test_format_citations_response(self):
        result = format_citations_response("hello [doc1] world [docs2]")
        self.assertEqual(result, "hello [1] world [2]")

    def test_format_citations_response_none(self):
        result = format_citations_response("hello world")
        self.assertEqual(result, "hello world")
