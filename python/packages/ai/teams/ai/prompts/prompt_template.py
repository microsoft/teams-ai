"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass

from .prompt_template_config import PromptTemplateConfig
from .sections.prompt_section import PromptSection


@dataclass
class PromptTemplate:
    """
    Prompt template cached by the prompt manager.

    Attributes:
        name (str): Name of the prompt template.

        prompt (PromptSection): Text of the prompt template.

        config (PromptTemplateConfig): Configuration settings for the prompt template.
    """

    name: str
    prompt: PromptSection
    config: PromptTemplateConfig
