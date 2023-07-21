"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from .prompt_template_config import PromptTemplateConfig


@dataclass
class PromptTemplate:
    "prompt template cached by the prompt manager"

    text: str
    "text of the prompt template"

    config: PromptTemplateConfig
    "configuration settings for the prompt template"
