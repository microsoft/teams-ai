"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import asyncio
from typing import Awaitable, Callable, List, Optional

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, Attachment

from ..app_error import ApplicationError
from .stream_types import StreamTypes
from .streaming_channel_data import StreamingChannelData


class StreamingResponse:
    """
    A helper class for streaming responses to the client.
    This class is used to send a series of updates to the client in a single response. The expected
    sequence of calls is:
    `queue_fnformative_update()`, `queue_text_chunk()`, `queue_text_chunk()`, ..., `end_stream()`.

    Once `end_stream()` is called, the stream ends and no further updates can be sent.
    """

    _context: TurnContext
    _next_sequence: int = 1
    _stream_id: str = ""
    _message: str = ""
    _attachments: List[Attachment] = []
    _ended: bool = False

    _queue: List[Callable[[], Activity]] = []
    _queue_sync: Optional[asyncio.Task] = None
    _chunk_queued: bool = False

    def __init__(self, context: TurnContext) -> None:
        """
        Initializes a new instance of the `StreamingResponse` class.
        :param context: The turn context.
        """
        self._context = context

    @property
    def stream_id(self) -> str:
        """
        Access the Streaming Response's stream_id.
        """
        return self._stream_id

    @property
    def message(self) -> str:
        """
        Returns the most recently straemed message.
        """
        return self._message

    def set_attachments(self, attachments: List[Attachment]) -> None:
        """
        Sets the attachments to attach to the final chunk.
        :param attachments: List of attachments.
        """
        self._attachments = attachments

    def updates_sent(self) -> int:
        """
        Returns the number of updates sent.
        """
        return self._next_sequence - 1

    def queue_informative_update(self, text: str) -> None:
        """
        Queue an informative update to be sent to the client.
        :param text: The text of the update to be sent.
        """
        if self._ended:
            raise ApplicationError("The stream has already ended.")

        # Queue a typing activity
        activity = Activity(
            type="typing",
            text=text,
            channel_data={"streamType":"informative", "streamSequence":self._next_sequence}
            # channel_data=StreamingChannelData(
            #     stream_type=StreamTypes.INFORMATIVE, stream_sequence=self._next_sequence
            # ),
        )
        self.queue_activity(lambda: activity)
        self._next_sequence += 1

    def queue_text_chunk(self, text: str) -> None:
        """
        Queues a chunk of partial message text to be sent to the client.
        The text we be sent as quickly as possible to the client. Chunks may be combined before
        delivery to the client.
        :param text: The text of the chunk to be sent.
        """
        if self._ended:
            raise ApplicationError("The stream has already ended.")

        self._message += text

        # Queue the next chunk
        self.queue_next_chunk()

    async def end_stream(self) -> None:
        """
        Ends the stream.
        """
        if self._ended:
            raise ApplicationError("The stream has already ended.")

        # Queue final message
        self._ended = True

        self.queue_next_chunk()

        # Wait for the queue to drain
        await self.wait_for_queue()

    async def wait_for_queue(self):
        """
        Waits for the outoging acitivty queue to be empty.
        """
        if self._queue_sync:
            await self._queue_sync

    def queue_next_chunk(self) -> None:
        """
        Queues the next chunk of text to be sent.
        """

        if self._chunk_queued:
            return

        # Queue a chunk of text to be sent
        self._chunk_queued = True
        self.queue_activity(self._format_next_chunk)

    def _format_next_chunk(self) -> Activity:
        """
        Sends the next chunk of text to the client.
        """
        self._chunk_queued = False
        if self._ended:
            return Activity(
                type="message",
                text=self._message,
                attachments=self._attachments,
                # channel_data=StreamingChannelData(stream_type=StreamTypes.FINAL),
                channel_data={"streamType":"final"}
            )
        activity = Activity(
            type="typing",
            text=self._message,
            channel_data={"streamType":"streaming", "streamSequence":self._next_sequence}
            # channel_data=StreamingChannelData(
            #     stream_type=StreamTypes.STREAMING, stream_sequence=self._next_sequence
            # ),
        )
        self._next_sequence += 1
        return activity

    def queue_activity(self, factory: Callable[[], Activity]) -> None:
        """
        Queues an activity to be sent to the client.
        :param activity_factory: A factory function that creates the activity to be sent.
        """
        self._queue.append(factory)

        # If there's no sync in progress, start one
        if not self._queue_sync or self._queue_sync.done():
            self._queue_sync = asyncio.create_task(self.drain_queue())

    async def drain_queue(self):
        """
        Sends any queued activities to the client until the queue is empty.
        """
        try:
            while len(self._queue) > 0:
                # Get next activity from queue
                factory = self._queue.pop(0)
                activity = factory()

                # Send activity
                await self.send_activity(activity)
        except:
            raise
        finally:
            # Queue is empty, mark as idle
            self._queue_sync = None

    async def send_activity(self, activity: Activity) -> None:
        """
        Sends an activity to the client and saves the stream ID returned.
        :param activity: The activity to send.
        """

        # Set activity ID to the assigned stream ID
        if self._stream_id:
            channel_data = activity.channel_data
            channel_data["streamId"] = self._stream_id
            activity.channel_data = channel_data

        # Send activity
        response = await self._context.send_activity(activity)
        await asyncio.sleep(1.5)

        # Save assigned stream ID
        if not self._stream_id:
            self._stream_id = response.id
