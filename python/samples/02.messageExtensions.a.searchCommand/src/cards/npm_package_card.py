"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any

from botbuilder.core import CardFactory
from botbuilder.schema import Attachment


def create_npm_package_card(result: Any) -> Attachment:
    """
    Creates an adaptive card for an npm package search result.

    Args:
        result (Any): The search result to create the card for.

    Returns:
        Attachment: The adaptive card attachment for the search result.
    """
    maintainers_list = []

    for maintainer in result["maintainers"]:
        maintainers_list.append(maintainer["email"])

    maintainers = ", ".join(maintainers_list)

    return CardFactory.adaptive_card(
        {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                {"type": "TextBlock", "size": "Medium", "weight": "Bolder", "text": result["name"]},
                {
                    "type": "FactSet",
                    "facts": [
                        {"title": "Scope", "value": result["scope"] if "scope" in result else ""},
                        {
                            "title": "Version",
                            "value": result["version"] if "version" in result else "",
                        },
                        {
                            "title": "Description",
                            "value": result["description"] if "description" in result else "",
                        },
                        {
                            "title": "Keywords",
                            "value": ", ".join(result["keywords"]) if "keywords" in result else "",
                        },
                        {"title": "Date", "value": result["date"] if "date" in result else ""},
                        {
                            "title": "Author",
                            "value": result["author"]["name"] if "author" in result else "",
                        },
                        {
                            "title": "Publisher",
                            "value": (
                                result["publisher"]["username"] if "publisher" in result else ""
                            ),
                        },
                        {"title": "Maintainers", "value": maintainers},
                    ],
                },
            ],
            "actions": [
                {
                    "type": "Action.OpenUrl",
                    "title": "NPM",
                    "url": (
                        result["links"]["npm"]
                        if "links" in result and "npm" in result["links"]
                        else ""
                    ),
                },
                {
                    "type": "Action.OpenUrl",
                    "title": "Homepage",
                    "url": (
                        result["links"]["homepage"]
                        if "links" in result and "hompeage" in result["links"]
                        else ""
                    ),
                },
                {
                    "type": "Action.OpenUrl",
                    "title": "Repository",
                    "url": (
                        result["links"]["repository"]
                        if "links" in result and "repository" in result["links"]
                        else ""
                    ),
                },
                {
                    "type": "Action.OpenUrl",
                    "title": "Bugs",
                    "url": (
                        result["links"]["bugs"]
                        if "links" in result and "bugs" in result["links"]
                        else ""
                    ),
                },
            ],
        }
    )
