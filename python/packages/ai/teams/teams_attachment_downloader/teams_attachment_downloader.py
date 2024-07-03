"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import List, Optional

import aiohttp
from botbuilder.core import TurnContext
from botbuilder.schema import Attachment
from botframework.connector.auth import AuthenticationConstants, GovernmentConstants

from ..input_file import InputFile, InputFileDownloader
from .teams_attachment_downloader_options import TeamsAttachmentDownloaderOptions


class TeamsAttachmentDownloader(InputFileDownloader):
    """
    Downloads attachments from Teams using the bot's access token.
    """

    _options: TeamsAttachmentDownloaderOptions

    def __init__(self, options: TeamsAttachmentDownloaderOptions):
        """
        Creates a new instance of the 'TeamsAttachmentDownloader' class

        Args:
            options (TeamsAttachmentDownloaderOptions): The options for configuring the class.
        """
        self._options = options

    async def download_files(self, context: TurnContext) -> List[InputFile]:
        """
        Download any files relative to the current user's input.

        Args:
            context (TurnContext): Context for the current turn of conversation.

        Returns:
            List[InputFile]: The list of input files
        """

        # Filter out HTML attachments
        valid_attachments = []
        attachments = context.activity.attachments

        if attachments is None or len(attachments) == 0:
            return []

        for attachment in attachments:
            if not attachment.content_type.startswith("text/html"):
                valid_attachments.append(attachment)

        if len(valid_attachments) == 0:
            return []

        access_token = ""

        # If authentication is enabled, get access token
        if await self._options.adapter.credentials_factory.is_authentication_disabled() is False:
            access_token = await self._get_access_token()

        files: List[InputFile] = []
        for attachment in valid_attachments:
            file = await self._download_file(attachment, access_token)
            if file is not None:
                files.append(file)

        return files

    async def _download_file(
        self, attachment: Attachment, access_token: str
    ) -> Optional[InputFile]:
        valid_http = attachment.content_url is not None and attachment.content_url.startswith(
            "https://"
        )
        valid_local_host = attachment.content_url is not None and attachment.content_url.startswith(
            "http://localhost"
        )

        if valid_http or valid_local_host:
            headers = {}

            if len(access_token) > 0:
                # Build request for downloading file if access token is available
                headers.update({"Authorization": f"Bearer {access_token}"})

            download_url = attachment.content_url
            if attachment.content and isinstance(attachment.content, dict):
                download_url = attachment.content.get("downloadUrl", attachment.content_url)
            async with aiohttp.ClientSession() as session:
                async with session.get(download_url, headers=headers) as response:
                    content = await response.read()

                    content_type = attachment.content_type

                    if content_type == "image/*":
                        content_type = "image/png"

                    return InputFile(content, content_type, attachment.content_url)
        else:
            content = bytes(attachment.content) if attachment.content else bytes()
            return InputFile(content, attachment.content_type, attachment.content_url)

    async def _get_access_token(self):
        # Normalize the to_channel_from_bot_login_url_prefix (and use a default when undefined).
        # If non-public (specific tenant) login URL is to be used, make sure the full url
        # including tenant ID is provided to TeamsAdapter on setup.
        to_channel_from_bot_login_url_default = (
            AuthenticationConstants.TO_CHANNEL_FROM_BOT_LOGIN_URL_PREFIX
            + AuthenticationConstants.DEFAULT_CHANNEL_AUTH_TENANT
        )

        to_channel_from_bot_login_url = getattr(
            self._options.adapter.configuration, "TO_CHANNEL_FROM_BOT_LOGIN_URL", ""
        )

        if not to_channel_from_bot_login_url:
            to_channel_from_bot_login_url = to_channel_from_bot_login_url_default

        audience = getattr(
            self._options.adapter.configuration, "TO_CHANNEL_FROM_BOT_OAUTH_SCOPE", ""
        )

        # If there is no to_channel_from_bot_login_url set on the provided
        # ConfigurationBotFrameworkAuthenticationOptions, or it starts with
        # 'https://login.microsoftonline.com/', the bot is operating in
        # Public Azure. So we use the Public Azure audience
        # or the specified audience.
        if to_channel_from_bot_login_url.startswith(
            AuthenticationConstants.TO_CHANNEL_FROM_BOT_LOGIN_URL_PREFIX
        ):
            if not audience:
                audience = AuthenticationConstants.TO_CHANNEL_FROM_BOT_OAUTH_SCOPE
        elif to_channel_from_bot_login_url.startswith(
            GovernmentConstants.TO_CHANNEL_FROM_BOT_LOGIN_URL_PREFIX
        ):
            # Or if the bot is operating in US Government Azure, use that audience.
            if not audience:
                audience = GovernmentConstants.TO_CHANNEL_FROM_BOT_OAUTH_SCOPE

        app_creds = await self._options.adapter.credentials_factory.create_credentials(
            self._options.bot_app_id, audience, to_channel_from_bot_login_url, True
        )
        return app_creds.get_access_token()
