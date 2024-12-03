"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Dict, List, cast

from botbuilder.core import TurnContext

from ...app_error import ApplicationError
from ...state.memory import MemoryBase
from ...streaming import PromptChunk, StreamHandlerTypes, StreamingResponse
from ...streaming.streaming_handlers import (
    BeforeCompletionHandler,
    ChunkReceivedHandler,
    ResponseReceivedHandler,
    StreamEventHandler,
)
from ..prompts.prompt_functions import PromptFunctions
from ..prompts.prompt_template import PromptTemplate
from ..tokenizers import Tokenizer
from .prompt_response import PromptResponse


class PromptCompletionModelEmitter:
    handlers: Dict[StreamHandlerTypes, List[StreamEventHandler]]

    def __init__(self):
        self.handlers = {}
        for event in StreamHandlerTypes:
            self.handlers[event] = []

    def subscribe(self, event: StreamHandlerTypes, handler: StreamEventHandler) -> None:
        if event in self.handlers:
            self.handlers[event].append(handler)

    def unsubscribe(self, event: StreamHandlerTypes, handler: StreamEventHandler) -> None:
        if event in self.handlers:
            if self.handlers[event].count(handler) == 1:
                self.handlers[event].remove(handler)

    def emit_before_completion(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
        streaming: bool,
    ) -> None:
        if StreamHandlerTypes.BEFORE_COMPLETION in self.handlers:
            for handler in self.handlers[StreamHandlerTypes.BEFORE_COMPLETION]:
                handler = cast(BeforeCompletionHandler, handler)
                try:
                    handler(context, memory, functions, tokenizer, template, streaming)
                except Exception as e:
                    raise ApplicationError("Failed to execute BeforeCompletion handler.") from e

    def emit_chunk_received(
        self,
        context: TurnContext,
        memory: MemoryBase,
        chunk: PromptChunk,
    ) -> None:
        if StreamHandlerTypes.CHUNK_RECEIVED in self.handlers:
            for handler in self.handlers[StreamHandlerTypes.CHUNK_RECEIVED]:
                handler = cast(ChunkReceivedHandler, handler)
                try:
                    handler(context, memory, chunk)
                except Exception as e:
                    raise ApplicationError("Failed to execute ChunkReceived handler.") from e

    def emit_response_received(
        self,
        context: TurnContext,
        memory: MemoryBase,
        response: PromptResponse[str],
        streamer: StreamingResponse,
    ) -> None:
        if StreamHandlerTypes.RESPONSE_RECEIVED in self.handlers:
            for handler in self.handlers[StreamHandlerTypes.RESPONSE_RECEIVED]:
                handler = cast(ResponseReceivedHandler, handler)
                try:
                    handler(context, memory, response, streamer)
                except Exception as e:
                    raise ApplicationError("Failed to execute ResponseReceived handler") from e
