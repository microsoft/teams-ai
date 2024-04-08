"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from botbuilder.core import TurnContext

from .get_user_token_client import get_user_token_client


async def sign_out_user(context: TurnContext, conn: str) -> None:
    client = get_user_token_client(context)

    if context.activity.from_property is None:
        raise RuntimeError("Activity.from cannot be None")

    await client.sign_out_user(
        context.activity.from_property.id if hasattr(context.activity.from_property, "id") else "",
        conn,
        context.activity.channel_id,
    )
