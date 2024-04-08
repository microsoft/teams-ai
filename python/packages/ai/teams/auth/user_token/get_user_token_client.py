"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import cast

from botbuilder.core import CloudAdapterBase, TurnContext
from botframework.connector.auth import UserTokenClient


def get_user_token_client(context: TurnContext) -> UserTokenClient:
    client = context.turn_state.get(cast(CloudAdapterBase, context.adapter).USER_TOKEN_CLIENT_KEY)

    if client is None:
        raise RuntimeError("OAuth prompt is not supported by the current adapter")

    return cast(UserTokenClient, client)
