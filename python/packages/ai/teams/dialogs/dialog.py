"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Generic, Optional, TypeVar, cast

from botbuilder.core import TurnContext
from botbuilder.dialogs import (
    ComponentDialog,
    DialogContext,
    DialogTurnResult,
    DialogTurnStatus,
    PromptOptions,
)

from ..state import ConversationState, TurnState

StateT = TypeVar("StateT", bound=TurnState)


class Dialog(ComponentDialog, Generic[StateT]):
    "base class for dialog implementations"

    async def create_dialog_context(self, context: TurnContext, state: StateT) -> DialogContext:
        """
        Create the dialog context

        Args:
            context (TurnContext): the turn context
            state (StateT): the turn state
            property (str): the turn state property

        Returns:
            The dialog context
        """
        self._dialogs._dialog_state = cast(ConversationState, state.conversation).create_property(
            self.id
        )
        return await self._dialogs.create_context(context)

    async def run_dialog(
        self, context: TurnContext, state: StateT, *, options: Optional[PromptOptions] = None
    ) -> DialogTurnResult:
        """
        Run or continue the authentication dialog.

        Args:
            context (TurnContext): the turn context
            state (StateT): the turn state
            property (str): the turn state property

        Returns:
            Dialog turn result that contains token if sign in successs
        """
        ctx = await self.create_dialog_context(context, state)
        res = await ctx.continue_dialog()

        if res.status == DialogTurnStatus.Empty:
            res = await ctx.begin_dialog(self.initial_dialog_id or "default", options)

        return res
