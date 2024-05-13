"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from logging import Logger
from typing import List, Optional

from botbuilder.core import Storage

from .adaptive_cards import AdaptiveCardsOptions
from .ai import AIOptions
from .auth import AuthOptions
from .input_file import InputFileDownloader
from .task_modules import TaskModulesOptions
from .teams_adapter import TeamsAdapter


@dataclass
class ApplicationOptions:
    adapter: Optional[TeamsAdapter] = None
    """
    Optional. Options used to initialize your `BotAdapter`
    """

    auth: Optional[AuthOptions] = None
    """
    Optional. Auth settings.
    """

    bot_app_id: str = ""
    """
    Optional. `Application` ID of the bot.
    """

    storage: Optional[Storage] = None
    """
    Optional. `Storage` provider to use for the application.
    """

    ai: Optional[AIOptions] = None
    """
    Optional. AI options to use. When provided, a new instance of the AI system will be created.
    """

    logger: Logger = Logger("teams.ai")
    """
    Optional. `Logger` that will be used in this application.
    """

    remove_recipient_mention: bool = True
    """
    Optional. If true, the bot will automatically remove mentions of the bot's name from incoming
    messages. Defaults to true.
    """

    start_typing_timer: bool = True
    """
    Optional. If true, the bot will automatically start a typing timer when messages are received.
    This allows the bot to automatically indicate that it's received the message and is processing
    the request. Defaults to true.
    """

    long_running_messages: bool = False
    """
    Optional. If true, the bot supports long running messages that can take longer then the 10 - 15
    second timeout imposed by most channels. Defaults to false.

    This works by immediately converting the incoming request to a proactive conversation.
    Care should be used for bots that operate in a shared hosting environment. 
    The incoming request is immediately completed and many shared hosting environments 
    will mark the bot's process as idle and shut it down.
    """

    adaptive_cards: AdaptiveCardsOptions = field(default_factory=AdaptiveCardsOptions)
    """
    Optional. Options used to customize the processing of Adaptive Card requests.
    """

    task_modules: TaskModulesOptions = field(default_factory=TaskModulesOptions)
    """
    Optional. Options used to customize the processing of Task Module requests.
    """

    file_downloaders: List[InputFileDownloader] = field(default_factory=list)
    """
    Optional. Array of input file download plugins to use. 
    """
