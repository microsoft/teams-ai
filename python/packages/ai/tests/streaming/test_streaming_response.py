"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase

import pytest
from botbuilder.core import CardFactory, TurnContext
from botbuilder.schema import Activity, Attachment, ChannelAccount, ConversationAccount

from teams.ai.prompts.message import Citation
from teams.app_error import ApplicationError
from teams.streaming.streaming_response import StreamingResponse
from tests.utils.adapter import SimpleAdapter


class TestStreamingResponse(IsolatedAsyncioTestCase):

    def create_mock_context(self):
        return TurnContext(
            SimpleAdapter(),
            Activity(
                id="1234",
                type="event",
                text="test",
                from_property=ChannelAccount(id="user", name="User Name"),
                recipient=ChannelAccount(id="bot", name="Bot Name"),
                conversation=ConversationAccount(id="convo", name="Convo Name"),
                channel_id="UnitTest",
                locale="en-uS",
                service_url="https://example.org",
            ),
        )

    @pytest.mark.asyncio
    async def test_single_informative_update(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_informative_update("starting")
        await streamer.wait_for_queue()
        self.assertEqual(streamer.updates_sent(), 1)

    @pytest.mark.asyncio
    async def test_double_informative_update(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_informative_update("first")
        streamer.queue_informative_update("second")
        await streamer.wait_for_queue()
        self.assertEqual(streamer.updates_sent(), 2)

    @pytest.mark.asyncio
    async def test_informative_update_assert_throws(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        await streamer.end_stream()

        with self.assertRaises(ApplicationError):
            streamer.queue_informative_update("first")

    @pytest.mark.asyncio
    async def test_send_text_chunk(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_text_chunk("first")
        await streamer.wait_for_queue()
        streamer.queue_text_chunk("second")
        await streamer.wait_for_queue()
        self.assertEqual(streamer.updates_sent(), 2)

    @pytest.mark.asyncio
    async def test_send_text_chunk_with_irrelevant_citations(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.set_citations(
            [
                Citation(
                    content="test-content", url="https://example.com", title="test", filepath="test"
                )
            ]
        )
        streamer.queue_text_chunk("first")
        await streamer.wait_for_queue()
        streamer.queue_text_chunk("second")
        await streamer.wait_for_queue()
        self.assertEqual(streamer.updates_sent(), 2)
        self.assertEqual(streamer.message, "firstsecond")
        self.assertIsNotNone(streamer.citations)

    @pytest.mark.asyncio
    async def test_send_text_chunk_assert_throws(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_text_chunk("first")
        await streamer.wait_for_queue()
        streamer.queue_text_chunk("second")
        await streamer.wait_for_queue()
        await streamer.end_stream()

        with self.assertRaises(ApplicationError):
            streamer.queue_text_chunk("third")
        self.assertEqual(streamer.updates_sent(), 2)

    @pytest.mark.asyncio
    async def test_end_stream(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        await streamer.end_stream()
        self.assertEqual(streamer.updates_sent(), 0)

    @pytest.mark.asyncio
    async def test_send_final_message(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_text_chunk("first")
        await streamer.wait_for_queue()
        streamer.queue_text_chunk("second")
        await streamer.wait_for_queue()
        await streamer.end_stream()
        self.assertEqual(streamer.updates_sent(), 2)

    @pytest.mark.asyncio
    async def test_send_final_chunk_attachment(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_text_chunk("first")
        await streamer.wait_for_queue()
        streamer.queue_text_chunk("second")
        await streamer.wait_for_queue()

        adaptive_card = CardFactory.adaptive_card(
            {
                "type": "AdaptiveCard",
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "version": "1.6",
                "body": [
                    {
                        "text": "This is an example of an attachment..",
                        "wrap": True,
                        "type": "TextBlock",
                    }
                ],
            }
        )

        attachment = Attachment(
            content=adaptive_card, content_type="application/vnd.microsoft.card.adaptive"
        )
        streamer._attachments = [attachment]
        await streamer.end_stream()
        self.assertEqual(len(streamer._attachments), 1)
        self.assertEqual(streamer.updates_sent(), 2)

    @pytest.mark.asyncio
    async def test_send_final_chunk_with_feedback_and_label(self):
        context = self.create_mock_context()
        streamer = StreamingResponse(context)
        streamer.queue_text_chunk("first")
        await streamer.wait_for_queue()
        streamer.set_feedback_loop(True)
        streamer.set_generated_by_ai_label(True)
        streamer.queue_text_chunk("second")
        await streamer.wait_for_queue()
        await streamer.end_stream()

        self.assertEqual(streamer.updates_sent(), 2)
