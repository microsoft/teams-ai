"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Literal, Union
from unittest import IsolatedAsyncioTestCase, mock

import httpx
import openai
import pytest

from teams.ai.embeddings.azure_openai_embeddings import AzureOpenAIEmbeddings
from teams.ai.embeddings.azure_openai_embeddings_options import (
    AzureOpenAIEmbeddingsOptions,
)

embedding_1 = [
    -0.006929283495992422,
    -0.016709936782717705,
    0.009889421984553337,
    -0.0007253705407492816,
]
embedding_2 = [
    -0.006929283495992422,
    -0.016709936782717705,
    0.009889421984553337,
    -0.0007253705407492816,
]


class MockAsyncEmbeddings:
    async def create(
        self,
        input: Union[str, List[str], List[int], List[List[int]]],
        model: Union[str, Literal["text-embedding-ada-002"]],
    ) -> openai.types.CreateEmbeddingResponse:
        # pylint: disable=unused-argument
        # this is necessary to override and mock the class
        return openai.types.CreateEmbeddingResponse(
            data=[
                openai.types.Embedding(embedding=embedding_1, index=1, object="embedding"),
                openai.types.Embedding(embedding=embedding_2, index=0, object="embedding"),
            ],
            model="text-embedding-ada-002",
            object="list",
            usage={"prompt_tokens": 5, "total_tokens": 5}  # type: ignore[arg-type]
            # need to ignore as "Usage" class is not yet an exported type from openai
        )


class MockAsyncAzureOpenAI:
    embeddings = MockAsyncEmbeddings()


class MockAsyncEmbeddingsRateLimited:
    async def create(
        self,
        input: Union[str, List[str], List[int], List[List[int]]],
        model: Union[str, Literal["text-embedding-ada-002"]],
    ) -> openai.types.CreateEmbeddingResponse:
        raise openai.RateLimitError(
            message="This is a rate limited error",
            response=httpx.Response(
                status_code=429, request=httpx.Request(method="method", url="url")
            ),
            body=None,
        )


class MockAsyncAzureOpenAIRateLimited:
    embeddings = MockAsyncEmbeddingsRateLimited()


class MockAsyncEmbeddingsAPIError:
    async def create(
        self,
        input: Union[str, List[str], List[int], List[List[int]]],
        model: Union[str, Literal["text-embedding-ada-002"]],
    ) -> openai.types.CreateEmbeddingResponse:
        raise openai.APIError(
            message="This is a bad request error",
            request=httpx.Request(method="method", url="url"),
            body=None,
        )


class MockAsyncAzureOpenAIAPIError:
    embeddings = MockAsyncEmbeddingsAPIError()


class TestOpenAIEmbeddings(IsolatedAsyncioTestCase):
    options: AzureOpenAIEmbeddingsOptions
    embeddings: AzureOpenAIEmbeddings
    options_with_array: AzureOpenAIEmbeddingsOptions
    embeddings_with_array: AzureOpenAIEmbeddings
    options_error: AzureOpenAIEmbeddingsOptions

    def setUp(self):
        self.options = AzureOpenAIEmbeddingsOptions(
            azure_api_key="empty",
            azure_endpoint="https://mock.openai.azure.com/",
            azure_deployment="text-embedding-ada-002",
            log_requests=True,
            retry_policy=[2, 4],
        )
        self.options_error = AzureOpenAIEmbeddingsOptions(
            azure_api_key="empty",
            azure_endpoint="www.mock.openai.azure.com/",
            azure_deployment="text-embedding-ada-002",
            log_requests=True,
            retry_policy=[2, 4],
        )
        self.options_with_array = AzureOpenAIEmbeddingsOptions(
            azure_api_key="empty",
            azure_endpoint="https://mock.openai.azure.com",
            azure_deployment="text-embedding-ada-002",
            azure_api_version="2023-05-15",
            log_requests=False,
            request_config={
                "Content-Type": "application/json",
                "User-Agent": "123",
            },
        )

    async def test_endpoint_error(self):
        with pytest.raises(ValueError):
            AzureOpenAIEmbeddings(self.options_error)

    @mock.patch("openai.AsyncAzureOpenAI", return_value=MockAsyncAzureOpenAI)
    async def test_string_embedding(self, mock_async_azure_open_ai):
        self.embeddings = AzureOpenAIEmbeddings(self.options)
        section = await self.embeddings.create_embeddings("This is an embedding")
        self.assertTrue(mock_async_azure_open_ai.called)
        self.assertEqual(section.status, "success")
        self.assertEqual(section.output, [embedding_2, embedding_1])

    @mock.patch("openai.AsyncAzureOpenAI", return_value=MockAsyncAzureOpenAI)
    async def test_array_embedding(self, mock_async_azure_open_ai):
        self.embeddings_with_array = AzureOpenAIEmbeddings(self.options_with_array)
        section = await self.embeddings_with_array.create_embeddings(["This is", "an embedding"])
        self.assertTrue(mock_async_azure_open_ai.called)
        self.assertEqual(section.status, "success")
        self.assertEqual(section.output, [embedding_2, embedding_1])

    @mock.patch("openai.AsyncAzureOpenAI", return_value=MockAsyncAzureOpenAIAPIError)
    async def test_api_error(self, mock_async_azure_open_ai):
        self.embeddings = AzureOpenAIEmbeddings(self.options)
        section = await self.embeddings.create_embeddings("This is an embedding")
        self.assertTrue(mock_async_azure_open_ai.called)
        self.assertEqual(section.status, "error")
        self.assertEqual(
            section.output,
            "The embeddings API returned an error status of None: This is a bad request error",
        )

    @mock.patch("openai.AsyncAzureOpenAI", return_value=MockAsyncAzureOpenAIRateLimited)
    async def test_rate_limited(self, mock_async_azure_open_ai):
        self.embeddings = AzureOpenAIEmbeddings(self.options)
        section = await self.embeddings.create_embeddings("This is an embedding")
        self.assertTrue(mock_async_azure_open_ai.called)
        self.assertEqual(section.status, "rate_limited")
        self.assertEqual(section.output, "The embeddings API returned a rate limit error.")
