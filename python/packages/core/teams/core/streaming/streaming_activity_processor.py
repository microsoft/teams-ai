# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.

from abc import ABC
from typing import Awaitable, Callable

from teams.core import TurnContext, InvokeResponse
from teams.schema import Activity


class StreamingActivityProcessor(ABC):
    """
    Process streaming activities.
    """

    async def process_streaming_activity(
        self,
        activity: Activity,
        bot_callback_handler: Callable[[TurnContext], Awaitable],
    ) -> InvokeResponse:
        raise NotImplementedError()
