"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations
from typing import Generic, Optional, TypeVar, cast

from msal import ConfidentialClientApplication
from botbuilder.schema import Activity, ActivityTypes
from botbuilder.dialogs import (
    DialogTurnResult,
    DialogTurnStatus,
    WaterfallDialog,
    WaterfallStepContext,
)
from botbuilder.core import TurnContext

from .sso_prompt import SsoPrompt
from ..auth_component import AuthComponent
from .sso_options import SsoOptions
from ...state import TurnState
from ...dialogs import Dialog

StateT = TypeVar("StateT", bound=TurnState)

SSO_DIALOG_ID = '_TeamsSsoDialog'

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

        # TODO - duplicate token exchange afterturn state 


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
    
    async def _step_one(self, context: WaterfallStepContext) -> DialogTurnResult:
        return await context.begin_dialog(
            "TeamsSsoPrompt"
        )
    
    async def _step_two(self, context: WaterfallStepContext) -> DialogTurnResult:
        token_response = context.result

        # TODO: Dedup token exchange responses
        return await context.end_dialog(token_response)