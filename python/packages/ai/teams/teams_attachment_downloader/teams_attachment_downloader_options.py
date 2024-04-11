"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass

from teams.teams_adapter import TeamsAdapter


@dataclass
class TeamsAttachmentDownloaderOptions:
    """
    Options for the `TeamsAttachmentDownloader` class.
    """

    bot_app_id: str
    "The Microsoft App ID of the bot"

    adapter: TeamsAdapter
    "ServiceClientCredentialsFactory"
