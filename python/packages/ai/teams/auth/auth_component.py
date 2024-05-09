"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import CloudAdapterBase, TurnContext
from botbuilder.schema import Activity
from botframework.connector.auth import UserTokenClient

from ..state import TurnState

StateT = TypeVar("StateT", bound=TurnState)


class AuthComponent(ABC, Generic[StateT]):
    """
    handles user sign-in and sign-out
    """

    @abstractmethod
    def is_sign_in_activity(self, activity: Activity) -> bool:
        """
        Whether the current activity is a valid activity that supports authentication

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.

        Returns:
            True if valid, otherwise False.
        """

    @abstractmethod
    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        """
        Signs in a user.
        This method will be called automatically by the Application class.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            state (StateT): Application state

        Returns:
            The authentication token if user is signed in. Otherwise returns null.
            In that case the bot will attempt to sign the user in.
        """

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        """
        Signs out a user.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            state (StateT): Application state
        """

    def _user_token_client(self, context: TurnContext) -> UserTokenClient:
        return cast(
            UserTokenClient,
            context.turn_state.get(cast(CloudAdapterBase, context.adapter).USER_TOKEN_CLIENT_KEY),
        )
