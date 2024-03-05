"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any, Generic, Optional, TypeVar, cast

from botbuilder.core import Storage, TurnContext

from .conversation_state import ConversationState
from .memory import MemoryBase
from .state import State, state
from .temp_state import TempState
from .user_state import UserState

ConversationStateT = TypeVar("ConversationStateT", bound=ConversationState)
UserStateT = TypeVar("UserStateT", bound=UserState)
TempStateT = TypeVar("TempStateT", bound=TempState)


@state
class TurnState(MemoryBase, State[State[Any]], Generic[ConversationStateT, UserStateT, TempStateT]):
    """
    Default Turn State
    """

    conversation: ConversationStateT
    user: UserStateT
    temp: TempStateT

    async def save(self, context: TurnContext, storage: Optional[Storage] = None) -> None:
        if storage and len(self.__deleted__) > 0:
            await storage.delete(self.__deleted__)

        for item in self.values():
            if isinstance(item, State):
                await item.save(context, storage)

    def has(self, path: str) -> bool:
        scope, name = self._get_scope_and_name(path)
        return scope in self and name in self[scope]

    def get(self, path: str) -> Optional[Any]:  # type: ignore[override]
        if not self.has(path):
            return None

        scope, name = self._get_scope_and_name(path)
        return self[scope][name]

    def set(self, path: str, value: Any) -> None:
        scope, name = self._get_scope_and_name(path)

        if not scope in self:
            raise KeyError(f"[{self.__class__.__name__}.set]: '{scope}' is not defined")

        self[scope][name] = value

    def delete(self, path: str) -> None:
        if not self.has(path):
            return

        scope, name = self._get_scope_and_name(path)
        del self[scope][name]

    @classmethod
    async def load(
        cls, context: TurnContext, storage: Optional[Storage] = None
    ) -> "TurnState[ConversationStateT, UserStateT, TempStateT]":
        conversation = await ConversationState.load(context, storage)
        user = await UserState.load(context, storage)
        temp = await TempState.load(context, storage)

        return cls(
            conversation=cast(ConversationStateT, conversation),
            user=cast(UserStateT, user),
            temp=cast(TempStateT, temp),
        )
