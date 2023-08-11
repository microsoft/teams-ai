"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""


class PromptManagerError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)
