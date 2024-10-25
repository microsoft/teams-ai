"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

import pytest
from botbuilder.core import TurnContext

from teams.ai.models.prompt_completion_model_emitter import PromptCompletionModelEmitter
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.prompts.prompt_functions import PromptFunctions
from teams.ai.prompts.prompt_template import PromptTemplate
from teams.ai.tokenizers.tokenizer import Tokenizer
from teams.state.memory import MemoryBase
from teams.streaming import (
    BeforeCompletionHandler,
    ChunkReceivedHandler,
    ResponseReceivedHandler,
    StreamHandlerTypes,
)
from teams.streaming.prompt_chunk import PromptChunk
from teams.streaming.streaming_response import StreamingResponse


class TestPromptCompletionModelEmitter(IsolatedAsyncioTestCase):
    emitter: PromptCompletionModelEmitter

    @pytest.fixture(autouse=True)
    def before_each(self):
        self.emitter = PromptCompletionModelEmitter()
        yield

    @pytest.mark.asyncio
    def test_subscribe_before_completion(self):
        before_completion = MagicMock(spec=BeforeCompletionHandler)
        self.emitter.subscribe(StreamHandlerTypes.BEFORE_COMPLETION, before_completion)
        self.assertEqual(len(self.emitter.handlers[StreamHandlerTypes.BEFORE_COMPLETION]), 1)
        self.assertEqual(
            self.emitter.handlers[StreamHandlerTypes.BEFORE_COMPLETION][0], before_completion
        )

    @pytest.mark.asyncio
    def test_subscribe_chunk_received(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        self.emitter.subscribe(StreamHandlerTypes.CHUNK_RECEIVED, chunk_received)
        self.assertEqual(len(self.emitter.handlers[StreamHandlerTypes.CHUNK_RECEIVED]), 1)
        self.assertEqual(
            self.emitter.handlers[StreamHandlerTypes.CHUNK_RECEIVED][0], chunk_received
        )

    @pytest.mark.asyncio
    def test_subscribe_response_received(self):
        response_received = MagicMock(spec=ResponseReceivedHandler)
        self.emitter.subscribe(StreamHandlerTypes.RESPONSE_RECEIVED, response_received)
        self.assertEqual(len(self.emitter.handlers[StreamHandlerTypes.RESPONSE_RECEIVED]), 1)
        self.assertEqual(
            self.emitter.handlers[StreamHandlerTypes.RESPONSE_RECEIVED][0], response_received
        )

    @pytest.mark.asyncio
    def test_unsubscribe_before_completion(self):
        before_completion = MagicMock(spec=BeforeCompletionHandler)
        self.emitter.subscribe(StreamHandlerTypes.BEFORE_COMPLETION, before_completion)
        self.emitter.unsubscribe(StreamHandlerTypes.BEFORE_COMPLETION, before_completion)
        self.assertEqual(len(self.emitter.handlers[StreamHandlerTypes.BEFORE_COMPLETION]), 0)

    @pytest.mark.asyncio
    def test_unsubscribe_chunk_received(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        self.emitter.subscribe(StreamHandlerTypes.CHUNK_RECEIVED, chunk_received)
        self.emitter.unsubscribe(StreamHandlerTypes.CHUNK_RECEIVED, chunk_received)
        self.assertEqual(len(self.emitter.handlers[StreamHandlerTypes.CHUNK_RECEIVED]), 0)

    @pytest.mark.asyncio
    def test_unsubscribe_response_received(self):
        response_received = MagicMock(spec=ResponseReceivedHandler)
        self.emitter.subscribe(StreamHandlerTypes.RESPONSE_RECEIVED, response_received)
        self.emitter.unsubscribe(StreamHandlerTypes.RESPONSE_RECEIVED, response_received)
        self.assertEqual(len(self.emitter.handlers[StreamHandlerTypes.RESPONSE_RECEIVED]), 0)

    @pytest.mark.asyncio
    def test_emit_before_completion(self):
        before_completion = MagicMock(spec=BeforeCompletionHandler)
        self.emitter.subscribe(StreamHandlerTypes.BEFORE_COMPLETION, before_completion)
        turn_context = MagicMock(spec=TurnContext)
        memory = MagicMock(spec=MemoryBase)
        functions = MagicMock(spec=PromptFunctions)
        tokenizer = MagicMock(spec=Tokenizer)
        template = MagicMock(spec=PromptTemplate)
        self.emitter.emit_before_completion(
            turn_context, memory, functions, tokenizer, template, True
        )
        before_completion.assert_called_once()

    @pytest.mark.asyncio
    def test_emit_chunk_received(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        self.emitter.subscribe(StreamHandlerTypes.CHUNK_RECEIVED, chunk_received)
        turn_context = MagicMock(spec=TurnContext)
        memory = MagicMock(spec=MemoryBase)
        prompt_chunk = MagicMock(spec=PromptChunk)
        self.emitter.emit_chunk_received(turn_context, memory, prompt_chunk)
        chunk_received.assert_called_once()

    @pytest.mark.asyncio
    def test_emit_response_received(self):
        response_received = MagicMock(spec=ResponseReceivedHandler)
        self.emitter.subscribe(StreamHandlerTypes.RESPONSE_RECEIVED, response_received)
        turn_context = MagicMock(spec=TurnContext)
        memory = MagicMock(spec=MemoryBase)
        prompt_response = MagicMock(spec=PromptResponse[str])
        streamer = MagicMock(spec=StreamingResponse)
        self.emitter.emit_response_received(turn_context, memory, prompt_response, streamer)
        response_received.assert_called_once()
