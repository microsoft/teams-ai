"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Callable, Union

from botbuilder.core import TurnContext

from ..ai.models.prompt_response import PromptResponse
from ..ai.prompts.prompt_functions import PromptFunctions
from ..ai.prompts.prompt_template import PromptTemplate
from ..ai.tokenizers import Tokenizer
from ..state.memory import MemoryBase
from .prompt_chunk import PromptChunk
from .streaming_response import StreamingResponse

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

StreamEventHandler = Union[BeforeCompletionHandler, ChunkReceivedHandler, ResponseReceivedHandler]
