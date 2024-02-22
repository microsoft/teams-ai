"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class OpenAIEmbeddingsOptions:
    """
    Options for configuring an `OpenAIEmbeddings` to generate embeddings.
    """

    api_key: str
    "API key to use. A new API key can be created at https://platform.openai.com/account/api-keys."

    model: str
    "Model to use."

    organization: Optional[str] = None
    "Optional. Organization to use."

    endpoint: Optional[str] = None
    "Optional. Endpoint to use."

    log_requests: Optional[bool] = False
    "Whether to log requests to the console, useful for debugging and defaults to `false`"

    retry_policy: Optional[List[int]] = None
    "Optional. Retry policy to use in seconds. The default retry policy is `[2, 5]`."

    request_config: Optional[Dict[str, str]] = None
    "Request options to use."
