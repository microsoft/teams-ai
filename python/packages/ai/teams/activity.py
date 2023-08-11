"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Awaitable, Callable, Literal, Union

from botbuilder.core import TurnContext

from teams.ai.state import TurnState

ActivityType = Literal[
    "message",
    "contactRelationUpdate",
    "conversationUpdate",
    "typing",
    "endOfConversation",
    "event",
    "invoke",
    "invokeResponse",
    "deleteUserData",
    "messageUpdate",
    "messageDelete",
    "installationUpdate",
    "messageReaction",
    "suggestion",
    "trace",
    "handoff",
    "command",
    "commandResult",
]

ActivityFunctionSync = Callable[[TurnContext, TurnState], bool]
ActivityFunctionAsync = Callable[[TurnContext, TurnState], Awaitable[bool]]
ActivityFunction = Union[ActivityFunctionSync, ActivityFunctionAsync]
