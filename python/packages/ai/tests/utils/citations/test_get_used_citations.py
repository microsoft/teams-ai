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
        assert result is not None
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
        if result is not None:
            self.assertEqual(len(result), 2)
        else:
            self.fail("Result is None")
        self.assertEqual(result, [citations[0], citations[2]])
