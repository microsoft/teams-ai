"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import time
import traceback
from typing import Any, Dict, List

from botbuilder.core import MemoryStorage, TurnContext
from langchain.chat_models.base import BaseChatModel
from langchain_openai import AzureChatOpenAI, ChatOpenAI
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTurnContext, ActionTypes
from teams.ai.prompts import PromptFunctions, PromptManager, PromptManagerOptions
from teams.ai.tokenizers import Tokenizer
from teams.state import MemoryBase, todict

from config import Config
from planner import LangChainPlanner
from state import AppTurnState

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise RuntimeError(
        "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set."
    )

model: BaseChatModel

if config.OPENAI_KEY:
    os.environ["OPENAI_API_KEY"] = config.OPENAI_KEY
    model = ChatOpenAI(model="gpt-4-turbo")
elif config.AZURE_OPENAI_KEY and config.AZURE_OPENAI_ENDPOINT:
    os.environ["AZURE_OPENAI_API_KEY"] = config.AZURE_OPENAI_KEY
    os.environ["AZURE_OPENAI_ENDPOINT"] = config.AZURE_OPENAI_ENDPOINT
    model = AzureChatOpenAI(model="gpt-4-turbo")

prompts = PromptManager(
    PromptManagerOptions(prompts_folder=f"{os.path.dirname(os.path.abspath(__file__))}/prompts")
)
storage = MemoryStorage()
app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        ai=AIOptions(
            planner=LangChainPlanner(
                model=model,
                prompts=prompts,
            )
        ),
    )
)


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@prompts.function("get_light_status")
async def on_get_light_status(
    _context: TurnContext,
    state: MemoryBase,
    _functions: PromptFunctions,
    _tokenizer: Tokenizer,
    _args: List[str],
):
    return "on" if state.get("conversation.lightsOn") else "off"


@app.ai.action(ActionTypes.SAY_COMMAND)
async def on_say(
    _context: ActionTurnContext,
    _state: AppTurnState,
):
    return ""


@app.ai.action("LightsOn")
async def on_lights_on(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    state.conversation.lights_on = True
    await context.send_activity("[lights on]")
    return "the lights are now on"


@app.ai.action("LightsOff")
async def on_lights_off(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    state.conversation.lights_on = False
    await context.send_activity("[lights off]")
    return "the lights are now off"


@app.ai.action("Pause")
async def on_pause(
    context: ActionTurnContext[Dict[str, Any]],
    _state: AppTurnState,
):
    time_ms = int(context.data["time"]) if context.data["time"] else 1000
    await context.send_activity(f"[pausing for {time_ms / 1000} seconds]")
    time.sleep(time_ms / 1000)
    return "done pausing"


@app.ai.action("LightStatus")
async def on_lights_status(
    _context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    return "the lights are on" if state.conversation.lights_on else "the lights are off"


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()
    print(todict(error))

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
