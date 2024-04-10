"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Dict, Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext

from ..state import TempState, TurnState
from .auth import Auth
from .sign_in_response import SignInResponse

StateT = TypeVar("StateT", bound=TurnState)


class AuthManager(Generic[StateT]):
    "authentication manager"

    _default: Optional[str]
    _connections: Dict[str, Auth[StateT]] = {}

    def __init__(self, *, default: Optional[str] = None) -> None:
        self._default = default

    def get(self, key: str) -> Auth[StateT]:
        """
        Gets the Auth connection

        Args:
            key (str): the auth connection key

        Returns:
            the auth connection if exists, otherwise raises a RuntimeError
        """

        if not key in self._connections:
            raise RuntimeError(f"could not find auth connection '{key}'")

        return self._connections[key]

    def set(self, key: str, value: Auth[StateT]) -> None:
        """
        Sets a new Auth connection

        Args:
            key (str): the auth connection key
            value (Auth[StateT]): the auth connection
        """
        self._connections[key] = value

    async def sign_in(
        self, context: TurnContext, state: StateT, *, key: Optional[str] = None
    ) -> SignInResponse:
        key = key if key is not None else self._default

        if not key:
            raise ValueError("must specify a connection 'key'")

        auth = self.get(key)
        res = SignInResponse("pending")
        token: Optional[str] = None

        try:
            token = await auth.sign_in(context, state)
        except Exception as err:  # pylint:disable=broad-exception-caught
            res.status = "error"
            res.message = str(err)
            return res

        if token:
            cast(TempState, state.temp).auth_tokens[key] = token
            res.status = "complete"

        return res

    async def sign_out(
        self, context: TurnContext, state: StateT, *, key: Optional[str] = None
    ) -> None:
        key = key if key is not None else self._default

        if not key:
            raise ValueError("must specify a connection 'key'")

        auth = self.get(key)
        await auth.sign_out(context, state)

    def _on_sign_in_complete(self, key: str):
        auth = self.get(key)

        async def __call__(context: TurnContext, state: StateT) -> bool:
            await auth.on_sign_in_complete(context, state)
            return True

        return __call__
