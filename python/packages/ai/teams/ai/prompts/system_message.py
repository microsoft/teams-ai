"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from .sections.template_section import TemplateSection


class SystemMessage(TemplateSection):
    """
    A system message
    """

    def __init__(self, template: str, tokens: float = -1):
        """
        Creates a new 'SystemMessage' instance.

        Args:
            template (str): Template to use for this section.
            tokens (int, optional): Sizing strategy for this section. Defaults to `auto`.
        """
        super().__init__(template, "system", tokens, True, "\n", "")
