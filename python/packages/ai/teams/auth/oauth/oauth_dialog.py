"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import CardFactory, TurnContext
from botbuilder.dialogs import (
    DialogTurnResult,
    DialogTurnStatus,
    OAuthPrompt,
    PromptOptions,
    WaterfallDialog,
    WaterfallStepContext,
)
from botbuilder.schema import Activity, ActivityTypes, Attachment, OAuthCard
from botframework.connector.models import ActionTypes, CardAction
from botframework.connector.token_api.models import TokenExchangeResource

from ...dialogs import Dialog
from ...state import TurnState
from ..auth_component import AuthComponent
from .oauth_options import OAuthOptions

StateT = TypeVar("StateT", bound=TurnState)


class OAuthDialog(Generic[StateT], Dialog[StateT], AuthComponent[StateT]):
    "handles dialog oauth authentication"

    _options: OAuthOptions

    def __init__(self, options: OAuthOptions) -> None:
        super().__init__(OAuthDialog.__name__)
        self.add_dialog(OAuthPrompt(OAuthPrompt.__name__, options))
        self.add_dialog(
            WaterfallDialog(
                WaterfallDialog.__name__,
                [self._step_one],
            )
        )

        self._options = options
        self.initial_dialog_id = WaterfallDialog.__name__

    def is_sign_in_activity(self, activity: Activity) -> bool:
        return (
            activity.type == ActivityTypes.message
            and activity.text is not None
            and activity.text != ""
        )

    async def sign_in(self, context: TurnContext, state: StateT) -> Optional[str]:
        res = await self.run_dialog(context, state)

        if res.status == DialogTurnStatus.Complete:
            await self.sign_out(context, state)

            if hasattr(res.result, "token"):
                return cast(str, getattr(res.result, "token"))

            return await self.sign_in(context, state)

        return None

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        if self.id in state.conversation:
            del state.conversation[self.id]

    async def _create_card(self, context: TurnContext) -> Attachment:
        client = self._user_token_client(context)
        token_exchange_resource: Optional[TokenExchangeResource] = None
        sign_in_resource = await client.get_sign_in_resource(
            self._options.connection_name,
            context.activity,
            "",
        )

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

    async def _step_one(self, context: WaterfallStepContext) -> DialogTurnResult:
        card = await self._create_card(context.context)
        return await context.begin_dialog(
            OAuthPrompt.__name__,
            PromptOptions(Activity(attachments=[card])),
        )
