"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from threading import Timer
from typing import Optional

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes, ErrorResponseException


class Typing:
    """
    Encapsulates the logic for sending "typing" activity to the user.
    """

    _interval: int
    _timer: Optional[Timer] = None

    def __init__(self, interval=1000) -> None:
        self._interval = interval

    async def start(self, context: TurnContext) -> None:
        if self._timer is not None:
            return

        func = self._on_timer(context)
        self._timer = Timer(self._interval, func)
        self._timer.start()
        await func()

    def stop(self) -> None:
        if self._timer:
            self._timer.cancel()
            self._timer = None

    def _on_timer(self, context: TurnContext):
        async def __call__():
            try:
                await context.send_activity(Activity(type=ActivityTypes.typing))
            except ErrorResponseException:
                self.stop()

        return __call__
