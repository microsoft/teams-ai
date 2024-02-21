"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Literal

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

ConversationUpdateType = Literal[
    "channelCreated",
    "channelRenamed",
    "channelDeleted",
    "channelRestored",
    "membersAdded",
    "membersRemoved",
    "teamRenamed",
    "teamDeleted",
    "teamArchived",
    "teamUnarchived",
    "teamRestored",
]

MessageReactionType = Literal["reactionsAdded", "reactionsRemoved"]

MessageUpdateType = Literal["editMessage", "softDeleteMessage", "undeleteMessage"]
