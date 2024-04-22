"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, cast

from botbuilder.core import CardFactory
from botbuilder.schema import CardAction, HeroCard
from botbuilder.schema.teams import MessagingExtensionAttachment


def create_npm_search_result_card(result: Any) -> MessagingExtensionAttachment:
    """
    Creates a messaging extension attachment for an npm search result.

    Args:
        result (Any): The search result to create the attachment for.

    Returns:
        MessagingExtensionAttachment: The messaging extension attachment for the search result.
    """
    card = cast(
        MessagingExtensionAttachment,
        CardFactory.hero_card(
            HeroCard(
                title=result["name"],
                images=[],
                buttons=[],
                tap=CardAction(type="invoke", value=result),
                text=result["description"] if "description" in result else "",
            )
        ),
    )
    return card
