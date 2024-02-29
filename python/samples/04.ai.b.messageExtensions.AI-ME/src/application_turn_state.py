"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from teams import ApplicationError
from teams.state import DefaultTempState, TurnState
from teams.state.turn_state import TEMP_SCOPE


class TempState(DefaultTempState):
    @property
    def post(self) -> str:
        return self._dict.get("post", "")

    @post.setter
    def post(self, value: str) -> None:
        self._dict["post"] = value

    @property
    def prompt(self) -> str:
        return self._dict.get("prompt", "")

    @prompt.setter
    def prompt(self, value: str) -> None:
        self._dict["prompt"] = value


class ApplicationTurnState(TurnState):
    @property
    def temp(self) -> TempState:
        scope = self.get_scope(TEMP_SCOPE)

        if scope is None:
            raise ApplicationError("TurnState hasn't been loaded. Call load() first.")

        return TempState(scope.data)

    @temp.setter
    def temp(self, value: TempState):
        scope = self.get_scope(TEMP_SCOPE)

        if scope is None:
            raise ApplicationError("TurnState hasn't been loaded. Call load() first.")

        scope.replace(value.get_dict())
