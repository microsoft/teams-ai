"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class AdaptiveCardsOptions:
    action_submit_filer: str = "verb"
    """
    Data field used to identify the Action.Submit handler to trigger.
    When an Action.Submit is triggered, the field name specified here will be used to determine
    the handler to route the request to.
    """
