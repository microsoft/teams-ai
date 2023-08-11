"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from dataclasses import dataclass
from logging import Logger
from typing import Generic, Optional, TypeVar

from botbuilder.core import BotAdapter, Storage

from teams.ai import AIOptions, TurnState, TurnStateManager

StateT = TypeVar("StateT", bound=TurnState)


@dataclass
class ApplicationOptions(Generic[StateT]):
    adapter: Optional[BotAdapter] = None
    """
    Optional. Bot adapter being used.
    If using the `long_running_messages` option or calling the `continue_conversation_async` 
    method, this property is required.
    """

    bot_app_id = ""
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

    turn_state_manager = TurnStateManager[StateT]()
    """
    Optional. Turn state manager to use. If omitted, an instance of `TurnStateManager` will
    be created using the parameterless constructor.
    """

    logger: Optional[Logger] = None
    """
    Optional. `Logger` that will be used in this application.
    """

    remove_recipient_mention = True
    """
    Optional. If true, the bot will automatically remove mentions of the bot's name from incoming
    messages. Defaults to true.
    """

    start_typing_timer = True
    """
    Optional. If true, the bot will automatically start a typing timer when messages are received.
    This allows the bot to automatically indicate that it's received the message and is processing
    the request. Defaults to true.
    """

    long_running_messages = False
    """
    Optional. If true, the bot supports long running messages that can take longer then the 10 - 15
    second timeout imposed by most channels. Defaults to false.

    This works by immediately converting the incoming request to a proactive conversation.
    Care should be used for bots that operate in a shared hosting environment. 
    The incoming request is immediately completed and many shared hosting environments 
    will mark the bot's process as idle and shut it down.
    """
