"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from botbuilder.core import CardFactory
from botbuilder.schema import Attachment

from food_order_view_schema import Beer, Order, Pizza, Salad, UnknownText


def generate_card_for_order(order: Order) -> Attachment:
    card_body = [
        {
            "type": "TextBlock",
            "text": "Your Order Summary",
            "weight": "Bolder",
            "size": "Medium",
            "wrap": True,
        },
        {
            "type": "Container",
            "items": [{"type": "TextBlock", "text": "Items:", "weight": "Bolder", "wrap": True}],
        },
    ]

    for item in order.items:
        if item.item_type == "pizza":
            pizza = Pizza.from_dict(item.to_dict())
            name = pizza.name if pizza.name else "Custom Pizza"

            card_body.append(
                {
                    "type": "TextBlock",
                    "text": f"{name} - Size: {pizza.size}, Quantity: {pizza.quantity}",
                    "wrap": True,
                }
            )
            break
        if item.item_type == "beer":
            beer = Beer.from_dict(item.to_dict())
            card_body.append(
                {
                    "type": "TextBlock",
                    "text": f"Beer - Kind: {beer.kind}, Quantity: {beer.quantity}",
                    "wrap": True,
                }
            )
            break
        if item.item_type == "salad":
            salad = Salad.from_dict(item.to_dict())
            card_body.append(
                {
                    "type": "TextBlock",
                    "text": f"`Salad - Style: {salad.style}, Portion: {salad.portion}, Quantity: {salad.quantity}",
                    "wrap": True,
                }
            )
            break
        if item.item_type == "unknown":
            unknown = UnknownText.from_dict(item.to_dict())
            card_body.append(
                {
                    "type": "TextBlock",
                    "text": f"Unknown Item: {unknown.text}",
                    "wrap": True,
                    "color": "Attention",
                }
            )
            break

    card = {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.2",
        "body": card_body,
    }

    return CardFactory.adaptive_card(card)
