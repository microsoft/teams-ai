"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from .sections.template_section import TemplateSection


class AssistantMessage(TemplateSection):
    """
    A message sent by the assistant.
    """

    def __init__(self, template: str, tokens: float = -1, text_prefix: str = "assistant: "):
        """
        Creates a new 'AssistantMessage' instance.

        Args:
            template (str): Template to use for this section.
            tokens (int, optional): Sizing strategy for this section. Defaults to `auto`.
            text_prefix (str, optional): Prefix to use for assistant messages when
              rendering as text. Defaults to `assistant: `.
        """
        super().__init__(template, "assistant", tokens, True, "\n", text_prefix)
