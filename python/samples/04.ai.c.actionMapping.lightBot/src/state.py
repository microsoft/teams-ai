"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import field

from teams.state import DefaultConversationState, TurnState


class AppConversationState(DefaultConversationState):
    lights_on: bool = field(default=False)

class AppTurnState(TurnState):

    @property
    def conversation(self) -> DefaultConversationState:
        scope = self.get_scope("conversation")

        if scope is None:
            raise RuntimeError("TurnState hasn't been loaded. Call load() first.")

        return AppConversationState(scope.data)

    @conversation.setter
    def conversation(self, value: AppConversationState):
        scope = self.get_scope("conversation")

        if scope is None:
            raise RuntimeError("TurnState hasn't been loaded. Call load() first.")

        scope.replace(value.get_dict())