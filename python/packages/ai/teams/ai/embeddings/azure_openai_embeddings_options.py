"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional


@dataclass
class AzureOpenAIEmbeddingsOptions:
    """
    Options for configuring an `AzureOpenAIEmbeddings` to generate embeddings.
    """

    azure_api_key: str
    "API key to use when making requests to Azure OpenAI."

    azure_endpoint: str
    "Deployment endpoint to use."

    azure_deployment: str
    "Name of the Azure OpenAI deployment (model) to use."

    azure_api_version: Optional[str] = None
    "Optional. Version of the API being called. Defaults to `2023-05-15`."

    log_requests: Optional[bool] = False
    "Whether to log requests to the console, useful for debugging and defaults to `false`"

    retry_policy: Optional[List[int]] = None
    "Optional. Retry policy to use in seconds. The default retry policy is `[2, 5]`."

    request_config: Optional[Dict[str, str]] = None
    "Request options to use."
