"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Dict, List, cast

from botbuilder.core import TurnContext

from ...app_error import ApplicationError
from ...state.memory import MemoryBase
from ...streaming.prompt_chunk import PromptChunk
from ...streaming.streaming_response import StreamingResponse
from ..prompts.prompt_functions import PromptFunctions
from ..prompts.prompt_template import PromptTemplate
from ..tokenizers import Tokenizer
from ...streaming.streaming_events import (
    BeforeCompletionHandler,
    ChunkReceivedHandler,
    StreamingEventTypes,
    ResponseReceivedHandler,
    Events
)
from .prompt_response import PromptResponse

class PromptCompletionModelEmitter:
    handlers: Dict[StreamingEventTypes, List[Events]]

    def __init__(self):
        self.handlers = {}
        for event in StreamingEventTypes:
            self.handlers[event] = []

    def subscribe(self, event: StreamingEventTypes, handler: Events) -> None:
        if event in self.handlers:
            return self.handlers[event].append(handler)
    
    def unsubscribe(self, event: StreamingEventTypes, handler: Events) -> None:
        if event in self.handlers:
            if self.handlers[event].count(handler) == 1:
                return self.handlers[event].remove(handler)

    def emit_before_completion(
        self,
        context: TurnContext,
        memory: MemoryBase,
        functions: PromptFunctions,
        tokenizer: Tokenizer,
        template: PromptTemplate,
        streaming: bool,
    ) -> None:
        if StreamingEventTypes.BEFORE_COMPLETION in self.handlers:
            for handler in self.handlers[StreamingEventTypes.BEFORE_COMPLETION]:
                handler = cast(BeforeCompletionHandler, handler)
                try:
                    handler(context, memory, functions, tokenizer, template, streaming)
                except Exception as e:
                    raise ApplicationError(f"Failed to execute BeforeCompletion handler. {e}")
    
    def emit_chunk_received(
        self,
        context: TurnContext,
        memory: MemoryBase,
        chunk: PromptChunk,
    ) -> None:
        if StreamingEventTypes.CHUNK_RECEIVED in self.handlers:
            for handler in self.handlers[StreamingEventTypes.CHUNK_RECEIVED]:
                handler = cast(ChunkReceivedHandler, handler)
                try:
                    handler(context, memory, chunk)
                except Exception as e:
                    raise ApplicationError(f"Failed to execute ChunkReceived handler. {e}")

    def emit_response_received(
        self,
        context: TurnContext,
        memory: MemoryBase,
        response: PromptResponse[str],
        streamer: StreamingResponse,
    ) -> None:
        if StreamingEventTypes.RESPONSE_RECEIVED in self.handlers:
                for handler in self.handlers[StreamingEventTypes.RESPONSE_RECEIVED]:
                    handler = cast(ResponseReceivedHandler, handler)
                    try:
                        handler(context, memory, response, streamer)
                    except Exception as e:
                        raise ApplicationError(f"Failed to execute ResponseReceived handler. {e}")