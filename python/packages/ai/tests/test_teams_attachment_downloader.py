"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

import json
from dataclasses import dataclass
from typing import Optional
from unittest import IsolatedAsyncioTestCase, mock

from botbuilder.schema import Attachment
from botframework.connector.auth import (
    Authentication,
    CallerIdConstants,
    GovernmentConstants,
    MicrosoftAppCredentials,
    PasswordServiceClientCredentialFactory,
)

from teams.input_file import InputFile
from teams.teams_adapter import TeamsAdapter
from teams.teams_attachment_downloader import (
    TeamsAttachmentDownloader,
    TeamsAttachmentDownloaderOptions,
)


class MockBFAppCredentials(MicrosoftAppCredentials):
    def __init__(self):
        super().__init__(app_id="botAppId", password="botAppPassword")

    def get_access_token(self, force_refresh: bool = False) -> str:
        return "authToken"


class MockCredentialsFactory(PasswordServiceClientCredentialFactory):
    def __init__(self):
        super().__init__(app_id="botAppId", password="botAppPassword")

    async def create_credentials(
        self,
        app_id: str,
        oauth_scope: str,
        login_endpoint: str,
        validate_authority: bool,
    ) -> Authentication:
        return MockBFAppCredentials()


@dataclass
class MockConfiguration:
    # pylint: disable=invalid-name
    # Need to replicate constants in configuration object
    TO_CHANNEL_FROM_BOT_LOGIN_URL: Optional[str] = ""
    TO_CHANNEL_FROM_BOT_OAUTH_SCOPE: Optional[str] = ""
    CALLER_ID: Optional[str] = ""


class MockedResponse:
    async def read(self):
        return bytes("file.png", "utf-8")


class TestTeamsAttachmentDownloader(IsolatedAsyncioTestCase):
    def create_mock_context(
        self, channel_id="channel1", bot_id="bot1", conversation_id="conversation1", user_id="user1"
    ):
        context = mock.MagicMock()
        context.activity.channel_id = channel_id
        context.activity.recipient.id = bot_id
        context.activity.conversation.id = conversation_id
        context.activity.from_property.id = user_id
        return context

    async def test_empty_attachments(self):
        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = []
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        self.assertEqual(input_files, [])

    async def test_no_attachments(self):
        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        self.assertEqual(input_files, [])

    async def test_html_attachment(self):
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="text/html", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        self.assertEqual(input_files, [])

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_download_file(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="https://example.com/file.png",
                )
            ],
        )

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_download_local_file(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="http://localhost:3978/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="http://localhost:3978/file.png",
                )
            ],
        )

    async def test_buffered_attachment(self):
        attachment = Attachment(
            content=json.dumps("file.png").encode("utf-8"),
            content_type="image/png",
            name="file.png",
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=json.dumps("file.png").encode("utf-8"),
                    content_type="image/png",
                    content_url=None,
                )
            ],
        )

    async def test_invalid_http_attachment(self):
        attachment = Attachment(
            content_url="http://example.com/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=bytes(),
                    content_type="image/png",
                    content_url="http://example.com/file.png",
                )
            ],
        )

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_update_mime_content_type(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="image/*", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(bot_app_id="botAppId", adapter=TeamsAdapter({}))
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="https://example.com/file.png",
                )
            ],
        )

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_download_file_with_enabled_auth(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(
                bot_app_id="botAppId",
                adapter=TeamsAdapter({}, credentials_factory=MockCredentialsFactory()),
            )
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="https://example.com/file.png",
                )
            ],
        )

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_download_file_with_enabled_auth_with_audience(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        config = MockConfiguration(
            TO_CHANNEL_FROM_BOT_OAUTH_SCOPE=GovernmentConstants.TO_CHANNEL_FROM_BOT_OAUTH_SCOPE
        )
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(
                bot_app_id="botAppId",
                adapter=TeamsAdapter(
                    config,
                    credentials_factory=MockCredentialsFactory(),
                ),
            )
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="https://example.com/file.png",
                )
            ],
        )

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_download_file_with_enabled_auth_gov(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(
                bot_app_id="botAppId",
                adapter=TeamsAdapter(
                    MockConfiguration(
                        GovernmentConstants.TO_CHANNEL_FROM_BOT_LOGIN_URL,
                        GovernmentConstants.TO_CHANNEL_FROM_BOT_OAUTH_SCOPE,
                        CallerIdConstants.us_gov_channel,
                    ),
                    credentials_factory=MockCredentialsFactory(),
                ),
            )
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="https://example.com/file.png",
                )
            ],
        )

    @mock.patch("aiohttp.ClientSession.get")
    async def test_should_download_file_with_enabled_auth_no_audience(self, mock_get):
        response_obj = MockedResponse()
        mock_get.return_value.__aenter__.return_value = response_obj
        mocked_content = await response_obj.read()
        attachment = Attachment(
            content_url="https://example.com/file.png", content_type="image/png", name="file.png"
        )

        context = self.create_mock_context()
        context.activity.type = "message"
        context.activity.text = "Here is the attachment"
        context.activity.attachments = [attachment]
        config = MockConfiguration(
            TO_CHANNEL_FROM_BOT_LOGIN_URL=GovernmentConstants.TO_CHANNEL_FROM_BOT_LOGIN_URL,
            CALLER_ID=CallerIdConstants.us_gov_channel,
        )
        downloader = TeamsAttachmentDownloader(
            TeamsAttachmentDownloaderOptions(
                bot_app_id="botAppId",
                adapter=TeamsAdapter(
                    config,
                    credentials_factory=MockCredentialsFactory(),
                ),
            )
        )

        input_files = await downloader.download_files(context)

        assert mock_get.call_count == 1
        self.assertEqual(
            input_files,
            [
                InputFile(
                    content=mocked_content,
                    content_type="image/png",
                    content_url="https://example.com/file.png",
                )
            ],
        )
