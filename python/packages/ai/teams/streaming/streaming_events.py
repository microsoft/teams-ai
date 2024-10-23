"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Callable, Union
from enum import Enum

from botbuilder.core import TurnContext

from ..state.memory import MemoryBase
from .prompt_chunk import PromptChunk
from .streaming_response import StreamingResponse
from ..ai.prompts.prompt_functions import PromptFunctions
from ..ai.prompts.prompt_template import PromptTemplate
from ..ai.tokenizers import Tokenizer
from ..ai.models.prompt_response import PromptResponse

BeforeCompletionHandler = Callable[
    [TurnContext, MemoryBase, PromptFunctions, Tokenizer, PromptTemplate, bool], None
]
"Triggered before the model is called to complete a prompt."

ChunkReceivedHandler = Callable[[TurnContext, MemoryBase, PromptChunk], None]
"Triggered when a chunk is received from the model via streaming."

ResponseReceivedHandler = Callable[
    [TurnContext, MemoryBase, PromptResponse[str], StreamingResponse], None
]
"Triggered after the model finishes returning a response."

Events = Union[BeforeCompletionHandler, ChunkReceivedHandler, ResponseReceivedHandler]

class StreamingEventTypes(str, Enum):
    BEFORE_COMPLETION = "BeforeCompletion"
    CHUNK_RECEIVED = "ChunkReceived"
    RESPONSE_RECEIVED = "ResponseReceived"
