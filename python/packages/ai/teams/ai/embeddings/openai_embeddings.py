"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

import asyncio
from datetime import datetime
from logging import Logger
from operator import attrgetter
from typing import List, Union

import openai

from teams.ai.embeddings.embeddings_model import EmbeddingsModel
from teams.ai.embeddings.embeddings_response import EmbeddingsResponse
from teams.ai.embeddings.openai_embeddings_options import OpenAIEmbeddingsOptions


class OpenAIEmbeddings(EmbeddingsModel):
    """
    A `EmbeddingsModel` for calling the OpenAI hosted model.
    """

    _log: Logger

    options: OpenAIEmbeddingsOptions
    "Options the client was configured with."

    def __init__(self, options: OpenAIEmbeddingsOptions, log=Logger("teams.ai")) -> None:
        """
        Creates a new `OpenAIEmbeddings` instance.

        Args:
            options (OpenAIEmbeddingsOptions): Options for configuring the embeddings client.
            log (Logger): Logger to use.
        """

        self.options = options
        self._log = log
        if not self.options.retry_policy:
            self.options.retry_policy = [2, 5]

    async def create_embeddings(
        self, inputs: Union[str, List[str], List[int], List[List[int]]], retry_count=0
    ) -> EmbeddingsResponse:
        """
        Creates embeddings for the given inputs.

        Args:
            inputs(Union[str, List[str]]): Text inputs to create embeddings for.

        Returns:
            EmbeddingsResponse: A status and embeddings/message when an error occurs.
        """

        if self.options.log_requests:
            self._log.info("Embeddings REQUEST: inputs=%s", inputs)

        if not self.options.request_config:
            self.options.request_config = {"Authorization": f"Bearer {self.options.api_key}"}
        else:
            self.options.request_config.update({"Authorization": f"Bearer {self.options.api_key}"})

        if not self.options.request_config.get("Content-Type"):
            self.options.request_config.update({"Content-Type": "application/json"})

        if not self.options.request_config.get("User-Agent"):
            self.options.request_config.update({"User-Agent": self.user_agent})

        if self.options.organization:
            self.options.request_config.update({"OpenAI-Organization": self.options.organization})

        client = openai.AsyncOpenAI(
            api_key=self.options.api_key, default_headers=self.options.request_config
        )

        try:
            start_time = datetime.now()
            res = await client.embeddings.create(input=inputs, model=self.options.model)

            data = list(map(attrgetter("embedding"), sorted(res.data, key=lambda x: x.index)))

            if self.options.log_requests:
                duration = datetime.now() - start_time
                self._log.info(
                    "Embeddings SUCCEEDED: duration=%s response=%s", duration.total_seconds, data
                )

            return EmbeddingsResponse(status="success", output=data)
        except openai.RateLimitError:
            if self.options.retry_policy:
                if retry_count < len(self.options.retry_policy):
                    delay = self.options.retry_policy[retry_count]
                    await asyncio.sleep(delay)
                    return await self.create_embeddings(inputs, retry_count + 1)
            return EmbeddingsResponse(
                status="rate_limited", output="The embeddings API returned a rate limit error."
            )
        except openai.APIError as err:
            return EmbeddingsResponse(
                status="error",
                output=f"The embeddings API returned an error status of {err.code}: {err.message}",
            )
