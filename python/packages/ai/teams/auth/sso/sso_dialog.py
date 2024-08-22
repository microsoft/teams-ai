"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.dialogs import (
    DialogTurnResult,
    DialogTurnStatus,
    WaterfallDialog,
    WaterfallStepContext,
)
from botbuilder.schema import Activity, ActivityTypes, SignInConstants
from msal import ConfidentialClientApplication

from ...dialogs import Dialog
from ...state import TurnState
from ..auth_component import AuthComponent
from .sso_options import SsoOptions
from .sso_prompt import SsoPrompt

StateT = TypeVar("StateT", bound=TurnState)

SSO_DIALOG_ID = "_TeamsSsoDialog"


class SsoDialog(Generic[StateT], Dialog[StateT], AuthComponent[StateT]):
    "handles dialog sso authentication"

    def __init__(self, name: str, options: SsoOptions, msal: ConfidentialClientApplication) -> None:
        super().__init__(SsoDialog.__name__)
        self.add_dialog(SsoPrompt("TeamsSsoPrompt", name, options, msal))
        self.add_dialog(
            WaterfallDialog(
                SSO_DIALOG_ID,
                [self._step_one, self._step_two],
            )
        )

        self._options = options
        self.initial_dialog_id = SSO_DIALOG_ID

        self.after_turn(self._handle_duplicate_token_exchange)

    async def _handle_duplicate_token_exchange(self, context: TurnContext, state: StateT) -> bool:
        return state.temp.duplicate_token_exchange != True

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

            if not getattr(state, "sign_in_retries", 0):
                setattr(state, "sign_in_retries", 1)
                return await self.sign_in(context, state)
            else:
                return None

        return None

    async def sign_out(self, context: TurnContext, state: StateT) -> None:
        if self.id in state.conversation:
            del state.conversation[self.id]

    async def _step_one(self, context: WaterfallStepContext) -> DialogTurnResult:
        return await context.begin_dialog("TeamsSsoPrompt")

    async def _step_two(self, context: WaterfallStepContext) -> DialogTurnResult:
        token_response = context.result

        if token_response and await self._should_dedup(context.context, context.state):
            context.state.temp.duplicate_token_exchange = True
            return DialogTurnResult(DialogTurnStatus.Waiting)

        context.state.temp.duplicate_token_exchange = False
        return await context.end_dialog(token_response)

    async def _should_dedup(self, context: TurnContext, state: StateT) -> bool:
        """
        Checks if deduplication should be performed for token exchange.
        """
        eTag = context.activity.value.get("id")
        store_item = {"eTag": eTag}
        key = self._get_storage_key(context)

        try:
            await self._options.storage.write({key: store_item})
        except Exception as e:
            if "eTag conflict" in str(e):
                return True
            raise e

        return False

    def _get_storage_key(self, context: TurnContext) -> str:
        """
        Gets the storage key for storing the token exchange state.
        """
        if not context or not context.activity or not context.activity.conversation:
            raise ValueError("Invalid context, cannot get storage key!")

        activity = context.activity
        if (
            activity.type != ActivityTypes.invoke
            or activity.name != SignInConstants.token_exchange_operation_name
        ):
            raise ValueError(
                "TokenExchangeState can only be used with Invokes of signin/tokenExchange."
            )

        value_id = activity.value.get("id")
        if not value_id:
            raise ValueError("Invalid signin/tokenExchange. Missing activity.value.id.")

        channel_id = activity.channel_id
        conversation_id = activity.conversation.id
        return f"{channel_id}/{conversation_id}/{value_id}"
