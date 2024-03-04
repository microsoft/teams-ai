"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class TaskModulesOptions:
    task_data_filter: str = "verb"
    """
    Data field to use to identify the verb of the handler to trigger.
    When a task module is triggered, the field name specified here will be used to determine
    the name of the verb for the handler to route the request to.
    """
