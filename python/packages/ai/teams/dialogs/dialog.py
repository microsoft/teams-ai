"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Generic, Optional, TypeVar

from botbuilder.core import TurnContext
from botbuilder.dialogs import (
    ComponentDialog,
    DialogContext,
    DialogSet,
    DialogState,
    DialogTurnResult,
    DialogTurnStatus,
)

from ..state import StatePropertyAccessor, TurnState

StateT = TypeVar("StateT", bound=TurnState)
OptionsT = TypeVar("OptionsT")


class Dialog(ComponentDialog, Generic[StateT, OptionsT]):
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
        accessor = StatePropertyAccessor[DialogState](state.conversation, self.id)
        dialog_set = DialogSet(accessor)
        dialog_set.add(self)
        return await dialog_set.create_context(context)

    async def run_dialog(
        self, context: TurnContext, state: StateT, *, options: Optional[OptionsT] = None
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
            res = await ctx.begin_dialog(self.id, options)

        return res
