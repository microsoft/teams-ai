"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Literal, Optional


# pylint: disable=too-many-instance-attributes
@dataclass
class CompletionConfig:
    """
    Interface for the completion configuration portion of a prompt template.

    Attributes:
        completion_type (Optional[Literal['chat','text']]): Type of completion to use.
          Defaults to using the completion type of the configured default model.
          New in schema version 1.1.

        frequency_penalty (float): The models frequency_penalty as a number between 0 and 1.
          Defaults to 0.

        include_history (bool): If true, the prompt will be augmented with the conversation history.
          Defaults to True.
          New in schema version 1.1.

        include_input (bool): If true, the prompt will be augmented with the user's input.
          Defaults to True.
          New in schema version 1.1.

        include_images (bool): If true, the prompt will be augmented with any images
          uploaded by the user. Defaults to False.
          New in schema version 1.1.

        max_tokens (int): The maximum number of tokens to generate.
          Defaults to 150.

        max_input_tokens (int): The maximum number of tokens allowed in the input.
          Defaults to 2048.
          New in schema version 1.1.

        model (Optional[str]): Name of the model to use otherwise the configured
          default model is used. Defaults to None.
          New in schema version 1.1.

        presence_penalty (float): The model's presence_penalty as a number between 0 and 1.
          Defaults to 0.

        stop_sequences (Optional[List[str]]): Array of stop sequences that when hit will
          stop generation. Defaults to None.

        temperature (float): The model's temperature as a number between 0 and 2.
          Defaults to 0.

        top_p (float): The model's top_p as a number between 0 and 2.
          Defaults to 0.

        data_sources (Optional[List[object]]): List of data sources to ground the answer in.
    """

    completion_type: Optional[Literal["chat", "text"]] = None
    frequency_penalty: float = 0
    include_history: bool = True
    include_input: bool = True
    include_images: bool = False
    max_tokens: int = 150
    max_input_tokens: int = 2048
    model: Optional[str] = None
    presence_penalty: float = 0
    stop_sequences: Optional[List[str]] = None
    temperature: float = 0
    top_p: float = 0
    data_sources: Optional[List[object]] = None

    @classmethod
    def from_dict(cls, data: dict) -> "CompletionConfig":
        return cls(
            completion_type=data.get("completion_type"),
            frequency_penalty=data.get("frequency_penalty", 0),
            include_history=data.get("include_history", True),
            include_input=data.get("include_input", True),
            include_images=data.get("include_images", False),
            max_tokens=data.get("max_tokens", 150),
            max_input_tokens=data.get("max_input_tokens", 2048),
            model=data.get("model"),
            presence_penalty=data.get("presence_penalty", 0),
            stop_sequences=data.get("stop_sequences"),
            temperature=data.get("temperature", 0),
            top_p=data.get("top_p", 0),
            data_sources=data.get("data_sources", None),
        )
