"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from unittest import IsolatedAsyncioTestCase
from unittest.mock import MagicMock

from botbuilder.core import TurnContext
import pytest

from teams.ai.models.prompt_completion_model_emitter import PromptCompletionModelEmitter
from teams.streaming.streaming_events import StreamingEventTypes, ResponseReceivedHandler, BeforeCompletionHandler, ChunkReceivedHandler
from teams.ai.models.prompt_response import PromptResponse
from teams.ai.prompts.prompt_functions import PromptFunctions
from teams.ai.prompts.prompt_template import PromptTemplate
from teams.ai.tokenizers.tokenizer import Tokenizer
from teams.app_error import ApplicationError
from teams.state.memory import MemoryBase
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
        self.emitter.subscribe(StreamingEventTypes.BEFORE_COMPLETION, before_completion)
        self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.BEFORE_COMPLETION]), 1)
        self.assertEqual(self.emitter.handlers[StreamingEventTypes.BEFORE_COMPLETION][0], before_completion)

    @pytest.mark.asyncio
    def test_subscribe_chunk_received(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        self.emitter.subscribe(StreamingEventTypes.CHUNK_RECEIVED, chunk_received)
        self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.CHUNK_RECEIVED]), 1)
        self.assertEqual(self.emitter.handlers[StreamingEventTypes.CHUNK_RECEIVED][0], chunk_received)
    
    @pytest.mark.asyncio
    def test_subscribe_response_received(self):
        response_received = MagicMock(spec=ResponseReceivedHandler)
        self.emitter.subscribe(StreamingEventTypes.RESPONSE_RECEIVED, response_received)
        self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.RESPONSE_RECEIVED]), 1)
        self.assertEqual(self.emitter.handlers[StreamingEventTypes.RESPONSE_RECEIVED][0], response_received)

    # @pytest.mark.asyncio
    # def test_subscribe_unrecognized_event(self):
    #     with self.assertRaises(ApplicationError) as context:
    #         self.emitter.subscribe("WRONG_EVENT", MagicMock())
    #     self.assertEqual(str(context.exception), "Cannot subscribe to an unrecognized event.")

    @pytest.mark.asyncio
    def test_subscribe_wrong_parameters(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        with self.assertRaises(ApplicationError):
            self.emitter.subscribe(StreamingEventTypes.BEFORE_COMPLETION, chunk_received)
    
    @pytest.mark.asyncio
    def test_unsubscribe_before_completion(self):
        before_completion = MagicMock(spec=BeforeCompletionHandler)
        self.emitter.subscribe(StreamingEventTypes.BEFORE_COMPLETION, before_completion)
        self.emitter.unsubscribe(StreamingEventTypes.BEFORE_COMPLETION, before_completion)
        self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.BEFORE_COMPLETION]), 0)

    @pytest.mark.asyncio
    def test_unsubscribe_chunk_received(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        self.emitter.subscribe(StreamingEventTypes.CHUNK_RECEIVED, chunk_received)
        self.emitter.unsubscribe(StreamingEventTypes.CHUNK_RECEIVED, chunk_received)
        self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.CHUNK_RECEIVED]), 0)
    
    @pytest.mark.asyncio    
    def test_unsubscribe_response_received(self):
        response_received = MagicMock(spec=ResponseReceivedHandler)
        self.emitter.subscribe(StreamingEventTypes.RESPONSE_RECEIVED, response_received)
        self.emitter.unsubscribe(StreamingEventTypes.RESPONSE_RECEIVED, response_received)
        self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.RESPONSE_RECEIVED]), 0)

    # @pytest.mark.asyncio
    # def test_unsubscribe_unrecognized_event(self):
    #     with self.assertRaises(ApplicationError) as context:
    #         self.emitter.unsubscribe("WRONG_EVENT", MagicMock())
    #     self.assertEqual(str(context.exception), "Cannot unsubscribe from an unrecognized event.")

    # @pytest.mark.asyncio
    # def test_unsubscribe_wrong_event(self):
    #     response_received = MagicMock(spec=ResponseReceivedHandler)
    #     self.emitter.subscribe(StreamingEventTypes.RESPONSE_RECEIVED, response_received)
    #     self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.RESPONSE_RECEIVED]), 1)
    #     with self.assertRaises(ApplicationError) as context:
    #         self.emitter.unsubscribe(StreamingEventTypes.CHUNK_RECEIVED, response_received)
    #     self.assertEqual(str(context.exception), "Cannot unsubscribe from an unrecognized event.")
    #     self.assertEqual(len(self.emitter.handlers[StreamingEventTypes.RESPONSE_RECEIVED]), 1)

    @pytest.mark.asyncio
    def test_emit_before_completion(self):
        before_completion = MagicMock(spec=BeforeCompletionHandler)
        self.emitter.subscribe(StreamingEventTypes.BEFORE_COMPLETION, before_completion)
        turn_context = MagicMock(spec=TurnContext)
        memory = MagicMock(spec=MemoryBase)
        functions = MagicMock(spec=PromptFunctions)
        tokenizer = MagicMock(spec=Tokenizer)
        template = MagicMock(spec=PromptTemplate)
        self.emitter.emit_before_completion(turn_context, memory, functions, tokenizer, template, True)
        before_completion.assert_called_once()

    @pytest.mark.asyncio
    def test_emit_chunk_received(self):
        chunk_received = MagicMock(spec=ChunkReceivedHandler)
        self.emitter.subscribe(StreamingEventTypes.CHUNK_RECEIVED, chunk_received)
        turn_context = MagicMock(spec=TurnContext)
        memory = MagicMock(spec=MemoryBase)
        prompt_chunk = MagicMock(spec=PromptChunk)
        self.emitter.emit_chunk_received(turn_context, memory, prompt_chunk)
        chunk_received.assert_called_once()
    
    @pytest.mark.asyncio    
    def test_emit_response_received(self):
        response_received = MagicMock(spec=ResponseReceivedHandler)
        self.emitter.subscribe(StreamingEventTypes.RESPONSE_RECEIVED, response_received)
        turn_context = MagicMock(spec=TurnContext)
        memory = MagicMock(spec=MemoryBase)
        prompt_response = MagicMock(spec=PromptResponse[str])
        streamer = MagicMock(spec=StreamingResponse)
        self.emitter.emit_response_received(turn_context, memory, prompt_response, streamer)
        response_received.assert_called_once()