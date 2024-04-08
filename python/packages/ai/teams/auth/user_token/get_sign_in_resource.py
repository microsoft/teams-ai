"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from botbuilder.core import TurnContext
from botframework.connector.auth import SignInUrlResponse

from .get_user_token_client import get_user_token_client


async def get_sign_in_resource(context: TurnContext, conn: str) -> SignInUrlResponse:
    client = get_user_token_client(context)
    return await client.get_sign_in_resource(conn, context.activity, "")
