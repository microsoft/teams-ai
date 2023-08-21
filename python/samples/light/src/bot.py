"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import time
import traceback
from typing import Any

from botbuilder.core import BotFrameworkAdapterSettings, MemoryStorage, TurnContext
from teams import (
    AIOptions,
    Application,
    ApplicationOptions,
    OpenAIPlanner,
    OpenAIPlannerOptions,
    TempState,
    TurnState,
    UserState,
)

from src.config import Config
from src.conversation import AppConversationState

config = Config()
storage = MemoryStorage()
app = Application[TurnState[AppConversationState, UserState, TempState]](
    ApplicationOptions[TurnState[AppConversationState, UserState, TempState]](
        bot_app_id=config.app_id,
        storage=storage,
        auth=BotFrameworkAdapterSettings(
            app_id=config.app_id,
            app_password=config.app_password,
        ),
        ai=AIOptions(
            prompt="chatGPT",
            planner=OpenAIPlanner(
                OpenAIPlannerOptions(
                    api_key="",
                    default_model="gpt-3.5-turbo",
                    log_requests=True,
                    prompt_folder=f"{os.getcwd()}/src/prompts",
                )
            ),
        ),
    )
)


@app.ai.function("getLightStatus")
async def on_get_light_status(
    _context: TurnContext, state: TurnState[AppConversationState, UserState, TempState]
):
    return "on" if state.conversation.value.lights_on else "off"


@app.ai.action("LightsOn")
async def on_lights_on(
    context: TurnContext,
    state: TurnState[AppConversationState, UserState, TempState],
    _data: Any,
    _name: str,
):
    state.conversation.value.lights_on = True
    await context.send_activity("[lights on]")
    return True


@app.ai.action("LightsOff")
async def on_lights_off(
    context: TurnContext,
    state: TurnState[AppConversationState, UserState, TempState],
    _data: Any,
    _name: str,
):
    state.conversation.value.lights_on = False
    print(state.conversation.value)
    await context.send_activity("[lights off]")
    return True


@app.ai.action("Pause")
async def on_pause(
    context: TurnContext,
    _state: TurnState[AppConversationState, UserState, TempState],
    data: Any,
    _name: str,
):
    time_ms = int(data.time) if data and data.time else 1000
    await context.send_activity(f"[pausing for {time_ms / 1000} seconds]")
    time.sleep(time_ms)
    return True


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
