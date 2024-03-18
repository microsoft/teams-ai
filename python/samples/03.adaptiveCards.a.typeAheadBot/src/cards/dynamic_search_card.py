"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from botbuilder.core import CardFactory
from botbuilder.schema import Attachment


def create_dynamic_search_card() -> Attachment:
    return CardFactory.adaptive_card(
        {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.6",
            "type": "AdaptiveCard",
            "body": [
                {
                    "text": "Please search for npm packages using dynamic search control.",
                    "wrap": True,
                    "type": "TextBlock",
                },
                {
                    "columns": [
                        {
                            "width": "stretch",
                            "items": [
                                {
                                    "choices": [],
                                    "choices.data": {
                                        "type": "Data.Query",
                                        "dataset": "npmpackages",
                                    },
                                    "id": "choiceSelect",
                                    "type": "Input.ChoiceSet",
                                    "placeholder": "Package name",
                                    "label": "NPM package search",
                                    "isRequired": True,
                                    "errorMessage": "There was an error",
                                    "isMultiSelect": True,
                                    "style": "filtered",
                                }
                            ],
                            "type": "Column",
                        }
                    ],
                    "type": "ColumnSet",
                },
            ],
            "actions": [
                {"type": "Action.Submit", "title": "Submit", "data": {"verb": "DynamicSubmit"}}
            ],
        }
    )
