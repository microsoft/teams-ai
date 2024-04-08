"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from botbuilder.core import TurnContext
from botframework.connector.auth import TokenResponse

from .get_user_token_client import get_user_token_client


async def get_user_token(context: TurnContext, conn: str, magic_code: str) -> TokenResponse:
    client = get_user_token_client(context)

    if context.activity.from_property is None:
        raise RuntimeError("Activity.from cannot be None")

    return await client.get_user_token(
        context.activity.from_property.id if hasattr(context.activity.from_property, "id") else "",
        conn,
        context.activity.channel_id,
        magic_code,
    )
