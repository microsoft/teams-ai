"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import Optional

from botbuilder.core import Storage
from botbuilder.schema import Activity, ChannelAccount


@dataclass
class UserState:
    """
    inherit a new interface from this base interface to strongly type
    the applications user state
    """

    __key__: str
    channel: ChannelAccount

    async def save(self, storage: Optional[Storage] = None) -> None:
        if storage:
            await storage.write(
                {
                    self.__key__: {},
                }
            )

    @classmethod
    async def from_activity(
        cls, activity: Activity, _storage: Optional[Storage] = None
    ) -> "UserState":
        if not activity.channel_id:
            raise ValueError("missing activity.channel_id")
        if not activity.from_property:
            raise ValueError("missing activity.from_property")
        if not activity.recipient:
            raise ValueError("missing activity.recipient")

        channel_id = activity.channel_id
        user_id = activity.from_property.id
        bot_id = activity.recipient.id
        key = f"{channel_id}/{bot_id}/users/{user_id}"

        return cls(__key__=key, channel=activity.from_property)
