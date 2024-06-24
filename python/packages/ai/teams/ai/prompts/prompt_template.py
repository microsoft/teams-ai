"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import List, Optional

import teams.ai.augmentations

from ..models.chat_completion_action import ChatCompletionAction
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

        actions (Optional[List[ChatCompletionAction]]): Optional
            list of actions the model may generate JSON inputs for.

        augmentation (Optional[Augmentation]): Optional augmentation for the prompt template.
    """

    name: str
    prompt: PromptSection
    config: PromptTemplateConfig
    actions: Optional[List[ChatCompletionAction]] = None
    augmentation: Optional[teams.ai.augmentations.Augmentation] = None
