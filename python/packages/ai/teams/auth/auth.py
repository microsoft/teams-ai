"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Awaitable, Callable, Generic, Optional, TypeVar, cast

from botbuilder.core import CloudAdapterBase, TurnContext
from botbuilder.schema import Activity, TokenResponse
from botframework.connector.auth import UserTokenClient

from ..state import TurnState
from .sign_in_response import SignInResponse

StateT = TypeVar("StateT", bound=TurnState)


class Auth(ABC, Generic[StateT]):
    """
    handles user sign-in and sign-out
    """

    _on_sign_in_success: Optional[Callable[[TurnContext, StateT], Awaitable[None]]] = None
    _on_sign_in_failure: Optional[
        Callable[[TurnContext, StateT, SignInResponse], Awaitable[None]]
    ] = None

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

    @abstractmethod
    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        """
        Signs out a user.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            state (StateT): Application state
        """

    @abstractmethod
    async def get_token(self, context: TurnContext) -> Optional[str]:
        """
        Check if the user is signed, if they are then return the token.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.

        Returns:
            The token if the user is signed. Otherwise null.
        """

    @abstractmethod
    async def verify_state(self, context: TurnContext, state: StateT) -> Optional[TokenResponse]:
        """
        Called on signin/verifyState activity.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            state (StateT): Current turn state.
        """

    @abstractmethod
    async def exchange_token(self, context: TurnContext, state: StateT) -> Optional[TokenResponse]:
        """
        Called on signin/tokenExchange activity.

        Args:
            context (TurnContext): Context for the current turn of conversation with the user.
            state (StateT): Current turn state.
        """

    def on_sign_in_success(
        self, callback: Callable[[TurnContext, StateT], Awaitable[None]]
    ) -> None:
        """
        The callback is called when the user has successfully signed in.

        Args:
            callback (Callable): The callback to call.
        """
        self._on_sign_in_success = callback

    def on_sign_in_failure(
        self, callback: Callable[[TurnContext, StateT, SignInResponse], Awaitable[None]]
    ) -> None:
        """
        The callback is called when the user has failed to signed in.

        Args:
            callback (Callable): The callback to call.
        """
        self._on_sign_in_failure = callback

    def _user_token_client(self, context: TurnContext) -> UserTokenClient:
        return cast(
            UserTokenClient,
            context.turn_state.get(cast(CloudAdapterBase, context.adapter).USER_TOKEN_CLIENT_KEY),
        )
