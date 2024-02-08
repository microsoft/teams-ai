"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import sys
import time
import traceback
from typing import Any, Dict

from botbuilder.core import MemoryStorage, TurnContext
from botbuilder.integration.aiohttp import ConfigurationBotFrameworkAuthentication
from botbuilder.schema import Activity
from teams import ActionTurnContext, ActionTypes, Application, ApplicationOptions

from src.config import Config
from state import AppTurnState

config = Config()
storage = MemoryStorage()

if config.OPEN_AI_KEY == "":
    raise RuntimeError("OpenAIKey is a required environment variable")

MyActionTurnContext = ActionTurnContext[Dict[str, Any]]
app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        auth=ConfigurationBotFrameworkAuthentication(Config),
        # ai=AIOptions(
        #     prompt="chatGPT",
        #     planner=OpenAIPlanner(
        #         OpenAIPlannerOptions(
        #             api_key=config.open_ai_key,
        #             default_model="gpt-3.5-turbo",
        #             prompt_folder=f"{os.getcwd()}/src/prompts",
        #         )
        #     ),
        #     history=AIHistoryOptions(assistant_history_type="text"),
        # ),
    )
)


@app.turn_state_factory
async def on_state_factory(activity: Activity):
    return await AppTurnState.from_activity(activity, storage)


@app.message("/history")
async def on_history(context: TurnContext, state: AppTurnState):
    if state.conversation.history.len() > 0:
        await context.send_activity(state.conversation.history.to_str(2000, "cl100k_base", "\n\n"))
    return True


@app.ai.function("getLightStatus")
async def on_get_light_status(_context: TurnContext, state: AppTurnState):
    return "on" if state.conversation.lights_on else "off"


@app.ai.action(ActionTypes.FLAGGED_INPUT)
async def on_flagged_input(context: TurnContext, _state: AppTurnState):
    await context.send_activity("FLAGGED INPUT!!!")
    return False


@app.ai.action("LightsOn")
async def on_lights_on(
    context: MyActionTurnContext,
    state: AppTurnState,
):
    state.conversation.lights_on = True
    await context.send_activity("[lights on]")
    return True


@app.ai.action("LightsOff")
async def on_lights_off(
    context: MyActionTurnContext,
    state: AppTurnState,
):
    state.conversation.lights_on = False
    await context.send_activity("[lights off]")
    return True


@app.ai.action("Pause")
async def on_pause(
    context: MyActionTurnContext,
    _state: AppTurnState,
):
    time_ms = int(context.data["time"]) if context.data["time"] else 1000
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
