"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Generic, Optional, TypeVar

from botbuilder.core import StatePropertyAccessor as _StatePropertyAccessor
from botbuilder.core import TurnContext

from .state import State

ValueT = TypeVar("ValueT")


class StatePropertyAccessor(_StatePropertyAccessor, Generic[ValueT]):
    _name: str
    _state: State

    def __init__(self, state: State, name: str) -> None:
        self._name = name
        self._state = state

    async def get(
        self, turn_context: TurnContext, default_value_or_factory: Optional[ValueT] = None
    ) -> Optional[ValueT]:
        value = self._state.get(self._name)

        if value is None and default_value_or_factory is not None:
            return default_value_or_factory

        return value

    async def delete(self, turn_context: TurnContext) -> None:
        del self._state[self._name]

    async def set(self, turn_context: TurnContext, value: ValueT) -> None:
        self._state[self._name] = value
