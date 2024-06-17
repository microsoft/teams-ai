"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import traceback
from typing import Any, Dict, List, Optional
from dataclasses import dataclass
from dataclasses_json import dataclass_json, DataClassJsonMixin

from botbuilder.core import MemoryStorage, TurnContext
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTurnContext
from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel, OpenAIModelOptions
from teams.ai.planners import ActionPlanner, ActionPlannerOptions
from teams.ai.prompts import PromptManager, PromptManagerOptions

from config import Config
from state import AppTurnState, WorkItem

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise RuntimeError(
        "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set."
    )

# Create AI components
model: OpenAIModel

if config.OPENAI_KEY:
    model = OpenAIModel(
        OpenAIModelOptions(api_key=config.OPENAI_KEY, default_model="gpt-3.5-turbo")
    )
elif config.AZURE_OPENAI_KEY and config.AZURE_OPENAI_ENDPOINT:
    model = OpenAIModel(
        AzureOpenAIModelOptions(
            api_key=config.AZURE_OPENAI_KEY,
            default_model="gpt-35-turbo",
            api_version="2023-03-15-preview",
            endpoint=config.AZURE_OPENAI_ENDPOINT,
        )
    )

prompts = PromptManager(PromptManagerOptions(prompts_folder=f"{os.path.dirname(os.path.abspath(__file__))}/prompts"))
storage = MemoryStorage()
app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        ai=AIOptions(planner=ActionPlanner(
            ActionPlannerOptions(model=model, prompts=prompts, default_prompt="sequence")
        )),
    )
)

@dataclass_json
@dataclass
class UserUpdate(DataClassJsonMixin):
    added: Optional[List[str]]
    removed: Optional[List[str]]

@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)

@app.ai.action("createWI")
async def on_create_work_item(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = WorkItem.from_dict(context.data, infer_missing=True)
    conversation = state.conversation
    parameters.id = conversation.next_id + 1
    parameters.status = "proposed"
    conversation.work_items.append(parameters)

    if parameters.assigned_to:
        return f"work item created with id {parameters.id} think about your next action;"
    return f"work item created with id {parameters.id} but needs to be assigned. think about your next action;"

@app.ai.action("updateWI")
async def on_update_work_item(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = WorkItem.from_dict(context.data, infer_missing=True)
    conversation = state.conversation
    for work_item in conversation.work_items:
        if work_item.id == parameters.id:
            work_item.title = parameters.title if parameters.title else work_item.title
            work_item.assigned_to = parameters.assigned_to if parameters.assigned_to else work_item.assigned_to
            work_item.status = parameters.status if parameters.status else work_item.status
            break
    return f"work item {parameters.id} was updated. think about your next action"

@app.ai.action("updateMembers")
async def on_update_members(
    context: ActionTurnContext[Dict[str, Any]],
    state: AppTurnState,
):
    parameters = UserUpdate.from_dict(context.data, infer_missing=True)

    if parameters.added is None and parameters.removed is None:
        return "no member changes made. think about your next action"
    
    conversation = state.conversation
    if parameters.added and len(parameters.added) > 0:
        for user in parameters.added:
            if conversation.members.count(user) == 0:
                conversation.members.append(user)

    if parameters.removed and len(parameters.removed) > 0:
        for user in parameters.removed:
            count = conversation.members.count(user)
            if count > 0:
                conversation.members.remove(user)

    return "members updated. think about your next action"

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
