"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Dict, Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes, InvokeResponse, SignInConstants

from ..state import TempState, TurnState
from .auth import Auth
from .sign_in_response import SignInResponse

StateT = TypeVar("StateT", bound=TurnState)


class AuthManager(Generic[StateT]):
    "authentication manager"

    _default: Optional[str]
    _connections: Dict[str, Auth[StateT]] = {}
    _exchanges: Dict[str, str] = {}

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
        token: Optional[str] = await auth.get_token(context)
        res = SignInResponse("pending")

        if token:
            cast(TempState, state.temp).auth_tokens[key] = token
            return SignInResponse("complete")

        try:
            if self._is_exchange_activity(context):
                exchange_key = self._get_exchange_key(key, context)

                if exchange_key in self._exchanges:
                    return res

                self._exchanges[exchange_key] = cast(dict, context.activity.value)["id"]
                token_res = await auth.exchange_token(context, state)

                if token_res is not None and hasattr(token_res, "token"):
                    token = token_res.token
                else:
                    # tell client to prompt for consent
                    await context.send_activity(
                        Activity(
                            type=ActivityTypes.invoke_response, value=InvokeResponse(status=412)
                        )
                    )

                    return res

                del self._exchanges[exchange_key]
            elif self._is_verify_state_activity(context):
                token_res = await auth.verify_state(context, state)

                if token_res is not None:
                    token = token_res.token
            else:
                token = await auth.sign_in(context, state)
        except Exception as err:  # pylint:disable=broad-exception-caught
            res.status = "error"
            res.reason = "other"
            res.message = str(err)

            if auth._on_sign_in_failure:
                await auth._on_sign_in_failure(context, state, res)

        if token:
            cast(TempState, state.temp).auth_tokens[key] = token
            res.status = "complete"

            if auth._on_sign_in_success:
                await auth._on_sign_in_success(context, state)

        return res

    async def sign_out(
        self, context: TurnContext, state: StateT, *, key: Optional[str] = None
    ) -> None:
        key = key if key is not None else self._default

        if not key:
            raise ValueError("must specify a connection 'key'")

        auth = self.get(key)
        await auth.sign_out(context, state)

    def _is_exchange_activity(self, context: TurnContext) -> bool:
        return context.activity.type == ActivityTypes.invoke and (
            context.activity.name == SignInConstants.token_exchange_operation_name
        )

    def _is_verify_state_activity(self, context: TurnContext) -> bool:
        return context.activity.type == ActivityTypes.invoke and (
            context.activity.name == SignInConstants.verify_state_operation_name
        )

    def _get_exchange_key(self, key: str, context: TurnContext) -> str:
        return (
            cast(str, getattr(context.activity.from_property, "id"))
            + "/"
            + cast(str, getattr(context.activity.conversation, "id"))
            + "/"
            + key
        )
