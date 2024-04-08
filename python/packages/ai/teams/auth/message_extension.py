"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes, InvokeResponse, TokenResponse
from botbuilder.schema.teams import (
    MessagingExtensionActionResponse,
    MessagingExtensionResult,
    MessagingExtensionSuggestedAction,
)
from botframework.connector.models import CardAction

from ..state import TurnState
from .auth import Auth

StateT = TypeVar("StateT", bound=TurnState)


class MessageExtension(Generic[StateT], Auth[StateT], ABC):
    """
    handles message extension authentication
    """

    @property
    @abstractmethod
    def enable_sso(self) -> bool:
        """
        is sso enabled
        """

    @property
    @abstractmethod
    def title(self) -> str:
        """
        Message Extension Title
        """

    @property
    @abstractmethod
    def text(self) -> str:
        """
        Message Extension Text
        """

    @abstractmethod
    async def get_sign_in_link(self, context: TurnContext) -> Optional[str]:
        """
        Gets the sign-in link for the user.

        Args:
            context (TurnContext): the current turn context

        Returns:
            the sign-in link if available
        """

    @abstractmethod
    async def sso_token_exchange(self, context: TurnContext) -> Optional[TokenResponse]:
        """
        Handles the SSO token exchange

        Args:
            context (TurnContext): the current turn context

        Returns:
            the token response
        """

    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        value = cast(dict, context.activity.value)

        if "authentication" in value and "token" in value["authentication"]:
            res = await self.sso_token_exchange(context)

            if res is not None and res.token != "":
                return res.token

            await context.send_activity(
                Activity(
                    type=ActivityTypes.invoke_response,
                    value=InvokeResponse(status=412),
                )
            )

        res = await self.on_sign_in_complete(context, state)

        if res is not None:
            return res.token

        await context.send_activity(
            Activity(
                type=ActivityTypes.invoke_response,
                value=InvokeResponse(
                    status=200,
                    body=MessagingExtensionActionResponse(
                        compose_extension=MessagingExtensionResult(
                            type=(
                                "silentAuth"
                                if context.activity.name == "composeExtension/query"
                                and self.enable_sso
                                else "auth"
                            ),
                            suggested_actions=MessagingExtensionSuggestedAction(
                                actions=[
                                    CardAction(
                                        type="openUrl",
                                        title=self.title,
                                        text=self.text,
                                        display_text=self.text,
                                    )
                                ],
                            ),
                        ),
                    ),
                ),
            )
        )

        return None
