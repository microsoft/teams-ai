# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from botbuilder.core import CardFactory
from botbuilder.schema import Attachment


def create_edit_view(post, preview_mode) -> Attachment:
    return CardFactory.adaptive_card(
        {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.4",
            "body": [
                {
                    "type": "Input.Text",
                    "id": "prompt",
                    "placeholder": "Enter a new prompt that updates the post below",
                    "isMultiline": True,
                },
                {
                    "type": "Container",
                    "minHeight": "160px",
                    "verticalContentAlignment": "Center",
                    "items": [
                        {"type": "TextBlock", "wrap": True, "text": post},
                        {"type": "Input.Text", "id": "post", "isVisible": False, "value": post},
                    ],
                },
            ],
            "actions": [
                {"type": "Action.Submit", "title": "Update", "data": {"verb": "update"}},
                {
                    "type": "Action.Submit",
                    "title": "Preview" if preview_mode else "Post",
                    "data": {"verb": "preview" if preview_mode else "post"},
                },
            ],
        }
    )
