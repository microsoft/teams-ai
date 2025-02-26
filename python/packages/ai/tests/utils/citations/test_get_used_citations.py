"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.ai.citations.citations import Appearance, ClientCitation
from teams.utils.citations import get_used_citations


class TestGetUsedCitations(TestCase):
    def test_get_used_citations(self):
        citations = [
            ClientCitation(
                position=1,
                appearance=Appearance(name="the title", abstract="some citation text..."),
            ),
            ClientCitation(
                position=2,
                appearance=Appearance(name="the title", abstract="some citation other text..."),
            ),
        ]
        text = "hello [1] world"
        result = get_used_citations(text, citations) # type: ignore
        assert result is not None
        self.assertEqual(len(result), 1)

        self.assertEqual(result, [citations[0]])

    def test_get_used_citations_longer(self):
        citations = [
            ClientCitation(
                position=1,
                appearance=Appearance(name="the title", abstract="some citation text..."),
            ),
            ClientCitation(
                position=2,
                appearance=Appearance(name="the title", abstract="some citation other text..."),
            ),
            ClientCitation(
                position=3,
                appearance=Appearance(name="the title", abstract="some citation text..."),
            ),
            ClientCitation(
                position=4,
                appearance=Appearance(name="the title", abstract="some citation other text..."),
            ),
        ]
        text = "hello [1] world [3]"
        result = get_used_citations(text, citations) # type: ignore
        if result is not None:
            self.assertEqual(len(result), 2)
        else:
            self.fail("Result is None")
        self.assertEqual(result, [citations[0], citations[2]])

    def test_get_used_citations_dict(self):
        citations = [
            {
                "position": 1,
                "appearance": {
                    "name": "the title",
                    "abstract": "some citation text..."
                }
            },
            {
                "position": 2,
                "appearance": {
                    "name": "the title",
                    "abstract": "some citation other text..."
                }
            },
            {
                "position": 3,
                "appearance": {
                    "name": "the title",
                    "abstract": "third citation text..."
                }
            }
        ]

        text = "hello [2] world [3]"
        result = get_used_citations(text, citations) # type: ignore

        assert result is not None
        self.assertEqual(len(result), 2)
        self.assertEqual(result, [citations[1], citations[2]])

        # Test with empty matches
        text_no_citations = "hello world with no citations"
        result_empty = get_used_citations(text_no_citations, citations) # type: ignore
        self.assertIsNone(result_empty)

        # Test with duplicate citations
        text_duplicate = "hello [1] world [1] again"
        result_duplicate = get_used_citations(text_duplicate, citations) # type: ignore
        assert result_duplicate is not None
        self.assertEqual(len(result_duplicate), 1)
        self.assertEqual(result_duplicate, [citations[0]])
