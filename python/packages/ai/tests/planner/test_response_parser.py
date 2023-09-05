"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import TestCase

from teams.ai.planner.response_parser import parse_adaptive_card


class TestParseAdaptiveCard(TestCase):
    def test_when_adaptive_card_exists(self):
        response = (
            '{"type": "AdaptiveCard", "body": [{"type": "TextBlock", "text": "Hello World!"}]}'
        )
        adaptive_card = parse_adaptive_card(response)
        self.assertEqual(
            adaptive_card,
            {"type": "AdaptiveCard", "body": [{"type": "TextBlock", "text": "Hello World!"}]},
        )

    def test_when_both_text_and_adaptive_card_exists(self):
        card = '{"type": "AdaptiveCard", "body": [{"type": "TextBlock", "text": "Hello World!"}]}'
        response = f"An example of adaptive card is: {card}"
        adaptive_card = parse_adaptive_card(response)
        self.assertEqual(
            adaptive_card,
            {"type": "AdaptiveCard", "body": [{"type": "TextBlock", "text": "Hello World!"}]},
        )

    def test_when_no_adaptive_card(self):
        response = '{"type": "HeroCard"}'
        adaptive_card = parse_adaptive_card(response)
        self.assertEqual(adaptive_card, None)

    def test_when_no_json(self):
        response = "I can't generate an adaptive card for you."
        adaptive_card = parse_adaptive_card(response)
        self.assertEqual(adaptive_card, None)

    def test_when_empty_response(self):
        response = ""
        adaptive_card = parse_adaptive_card(response)
        self.assertEqual(adaptive_card, None)
