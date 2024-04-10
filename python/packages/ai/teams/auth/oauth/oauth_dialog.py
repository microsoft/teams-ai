"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import CardFactory, MessageFactory, TurnContext
from botbuilder.dialogs import (
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt,
    PromptOptions,
)
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    Attachment,
    OAuthCard,
    TokenResponse,
)
from botframework.connector.models import ActionTypes, CardAction, ChannelAccount
from botframework.connector.token_api.models import TokenExchangeResource

from ...dialogs import Dialog
from ...state import TurnState
from ..auth import Auth
from ..sign_in_response import SignInResponse
from ..user_token import get_sign_in_resource, get_user_token
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthDialog(Generic[StateT], Dialog[StateT, PromptOptions], Auth[StateT]):
    "handles dialog oauth authentication"

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__("OAuthDialog")
        self._options = options
        self.add_dialog(OAuthPrompt("OAuthPrompt", options))

    def is_valid_activity(self, activity: Activity) -> bool:
        return (
            activity.type == ActivityTypes.message
            and activity.text is not None
            and activity.text != ""
        )

    async def run_dialog(
        self, context: TurnContext, state: StateT, *, options: Optional[PromptOptions] = None
    ) -> DialogTurnResult:
        if options is None:
            card = await self._create_card(context)
            options = PromptOptions(MessageFactory.attachment(card))

        return await super().run_dialog(context, state, options=options)

    async def is_signed_in(self, context: TurnContext) -> Optional[str]:
        res = await get_user_token(context, self._options.connection_name, "")

        if res is not None and res.token != "":
            return res.token

        return None

    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        auth_key = self._get_auth_state_key(context)

        if not auth_key in state.conversation:
            state.conversation[auth_key] = {"message": context.activity.text}

        res = await self.run_dialog(context, state)

        if res.status == DialogTurnStatus.Complete:
            await self.sign_out(context, state)

            if hasattr(res.result, "token"):
                return cast(str, getattr(res.result, "token"))

            return await self.sign_in(context, state)

        return None

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        auth_key = self._get_auth_state_key(context)
        dialog_key = self._get_dialog_state_key(context)

        del state.conversation[auth_key]
        del state.conversation[dialog_key]

    async def on_sign_in_complete(
        self, context: TurnContext, state: StateT
    ) -> Optional[TokenResponse]:
        auth_key = self._get_auth_state_key(context)
        res = await self.run_dialog(context, state)

        if res.status != DialogTurnStatus.Complete:
            return None

        token_response = cast(TokenResponse, res.result)

        if token_response.token is None or token_response.token == "":
            if self._on_sign_in_failure is not None:
                await self._on_sign_in_failure(
                    context,
                    state,
                    SignInResponse(
                        "error",
                        "completion-without-token",
                        "Authentication flow completed without a token",
                    ),
                )
            return None

        auth_state = state.conversation[auth_key] if auth_key in state.conversation else {}
        context.activity.text = auth_state["message"] if "message" in auth_state else ""

        if self._on_sign_in_success is not None:
            await self._on_sign_in_success(context, state)

        return token_response

    def _get_auth_state_key(self, context: TurnContext) -> str:
        return f"__{cast(ChannelAccount, context.activity.from_property).id}:AuthState__"

    def _get_dialog_state_key(self, context: TurnContext) -> str:
        return f"__{cast(ChannelAccount, context.activity.from_property).id}:DialogState__"

    async def _create_card(self, context: TurnContext) -> Attachment:
        token_exchange_resource: Optional[TokenExchangeResource] = None
        sign_in_resource = await get_sign_in_resource(context, self._options.connection_name)

        if self._options.enable_sso:
            token_exchange_resource = sign_in_resource.token_exchange_resource

        return CardFactory.oauth_card(
            OAuthCard(
                text=self._options.text,
                connection_name=self._options.connection_name,
                token_exchange_resource=token_exchange_resource,
                buttons=[
                    CardAction(
                        type=ActionTypes.signin,
                        title=self._options.title,
                        value=sign_in_resource.sign_in_link,
                    )
                ],
            )
        )
