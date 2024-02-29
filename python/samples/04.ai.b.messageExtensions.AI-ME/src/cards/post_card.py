# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from botbuilder.core import CardFactory
from botbuilder.schema import Attachment


def create_post_card(post: str) -> Attachment:
    return CardFactory.adaptive_card(
        {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.4",
            "body": [
                {"type": "TextBlock", "text": post, "wrap": True},
                {
                    "type": "TextBlock",
                    "text": "by GPT",
                    "size": "Small",
                    "horizontalAlignment": "Right",
                    "isSubtle": True,
                },
            ],
        }
    )
