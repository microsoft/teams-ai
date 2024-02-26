"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from .sections.template_section import TemplateSection


class UserMessage(TemplateSection):
    """
    A user message
    """

    def __init__(self, template: str, tokens: float = -1, user_prefix: str = "user: "):
        """
        Creates a new 'UserMessage' instance.

        Args:
            template (str): Template to use for this section.
            tokens (int, optional): Sizing strategy for this section. Defaults to `auto`.
            user_prefix (str, optional): Prefix to use for user messages when
                rendering as text. Defaults to `user: `.
        """
        super().__init__(template, "user", tokens, True, "\n", user_prefix)
