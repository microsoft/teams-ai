"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List, Union


@dataclass
class CompletionConfig:
    "interface for the completion configuration portion of a prompt template"

    tempurature: float
    "the models temperature as a number between 0 and 1"

    top_p: float
    "the models top_p as a number between 0 and 1"

    presence_penalty: float
    "the models presence_penalty as a number between 0 and 1"

    frequency_penalty: float
    "the models frequency_penalty as a number between 0 and 1"

    max_tokens: int
    "the models maximum number of tokens to generate"

    stop_sequences: Union[List[str], None]
    "optional: array of stop sequences that when hit will stop generation"
