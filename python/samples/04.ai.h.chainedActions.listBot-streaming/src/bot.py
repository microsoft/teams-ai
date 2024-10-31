"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import traceback
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from botbuilder.core import CardFactory, MemoryStorage, TurnContext
from dataclasses_json import DataClassJsonMixin, dataclass_json
from teams import Application, ApplicationOptions, FeedbackLoopData, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTurnContext
from teams.ai.models import (
    AzureOpenAIModelOptions,
    OpenAIModel,
    OpenAIModelOptions,
    PromptResponse,
)
from teams.ai.planners import ActionPlanner, ActionPlannerOptions
from teams.ai.prompts import PromptManager, PromptManagerOptions
from teams.state import MemoryBase
from teams.streaming import StreamingResponse

from config import Config
from state import AppTurnState

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise RuntimeError(
        "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set."
    )

# Create AI components
model: OpenAIModel

if config.OPENAI_KEY:
    model = OpenAIModel(
        OpenAIModelOptions(api_key=config.OPENAI_KEY, default_model="gpt-4o", stream=True)
    )
elif config.AZURE_OPENAI_KEY and config.AZURE_OPENAI_ENDPOINT:
    model = OpenAIModel(
        AzureOpenAIModelOptions(
            api_key=config.AZURE_OPENAI_KEY,
            default_model="gpt-4o",
            api_version="2023-03-15-preview",
            endpoint=config.AZURE_OPENAI_ENDPOINT,
            stream=True,
        )
    )


def end_stream_handler(
    context: TurnContext,
    state: MemoryBase,
    response: PromptResponse[str],
    streamer: StreamingResponse,
):
    if not streamer:
        return

    card = CardFactory.adaptive_card(
        {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "version": "1.6",
            "type": "AdaptiveCard",
            "body": [{"type": "TextBlock", "wrap": True, "text": streamer.message}],
        }
    )

    streamer.set_attachments([card])


enableFeedbackLoop = True
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
            enable_feedback_loop=enableFeedbackLoop,
            planner=ActionPlanner(
                ActionPlannerOptions(
                    model=model,
                    prompts=prompts,
                    default_prompt="tools",
                    enable_feedback_loop=enableFeedbackLoop,
                    start_streaming_message="Loading streaming results...",
                    end_stream_handler=end_stream_handler,
                )
            ),
        ),
    )
)


@dataclass_json
@dataclass
class ListAndItems(DataClassJsonMixin):
    list: str
    items: Optional[List[str]]


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@app.feedback_loop()
async def feedback_loop(context: TurnContext, state: AppTurnState, feedback_data: FeedbackLoopData):
    print("Feedback loop triggered")


@app.ai.action("createList")
async def on_create_list(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = ListAndItems.from_dict(context.data, infer_missing=True)
    state.ensure_list_exists(parameters.list)
    if parameters.items is not None and len(parameters.items) > 0:
        await on_add_items(context, state)
        return "list created and items added. think about your next action"
    return "list created. think about your next action"


@app.ai.action("deleteList")
async def on_delete_list(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = ListAndItems.from_dict(context.data, infer_missing=True)
    if parameters.list in state.conversation.lists:
        del state.conversation.lists[parameters.list]
    return "list deleted. think about your next action"


@app.ai.action("addItems")
async def on_add_items(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = ListAndItems.from_dict(context.data, infer_missing=True)
    state.ensure_list_exists(parameters.list)
    items = state.conversation.lists[parameters.list]
    if parameters.items is not None:
        for item in parameters.items:
            items.append(item)
        state.conversation.lists[parameters.list] = items
    return "items added. think about your next action"


@app.ai.action("removeItems")
async def on_remove_items(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = ListAndItems.from_dict(context.data, infer_missing=True)
    state.ensure_list_exists(parameters.list)
    items = state.conversation.lists[parameters.list]
    if parameters.items is not None and len(parameters.items) > 0:
        for item in parameters.items:
            if item in items:
                items.remove(item)
        state.conversation.lists[parameters.list] = items
    return "items removed. think about your next action"


@app.message("/reset")
async def on_reset(context: TurnContext, state: AppTurnState):
    del state.conversation
    await context.send_activity("Ok let's start this over")
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
