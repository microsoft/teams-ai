"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from typing import List


@dataclass
class CompletionConfig:
    "interface for the completion configuration portion of a prompt template"

    temperature: float
    "the models temperature as a number between 0 and 1"

    top_p: float
    "the models top_p as a number between 0 and 1"

    presence_penalty: float
    "the models presence_penalty as a number between 0 and 1"

    frequency_penalty: float
    "the models frequency_penalty as a number between 0 and 1"

    max_tokens: int
    "the models maximum number of tokens to generate"

    stop_sequences: List[str]
    "optional: array of stop sequences that when hit will stop generation"

    @staticmethod
    def from_dict(data: dict) -> "CompletionConfig":
        "creates a CompletionConfig from a dictionary"
        # TODO: should we have default values for the properties?
        return CompletionConfig(
            temperature=data["temperature"],
            top_p=data["top_p"],
            presence_penalty=data["presence_penalty"],
            frequency_penalty=data["frequency_penalty"],
            max_tokens=data["max_tokens"],
            stop_sequences=data.get("stop_sequences", []),
        )
