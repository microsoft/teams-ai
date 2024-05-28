"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import traceback

from botbuilder.core import MemoryStorage, TurnContext
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTurnContext, ActionTypes
from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel, OpenAIModelOptions
from teams.ai.planners import ActionPlanner, ActionPlannerOptions
from teams.ai.prompts import PromptManager, PromptManagerOptions
from teams.state import TurnState
from teams.ai.moderators import Moderator, OpenAIModerator, OpenAIModeratorOptions, AzureContentSafetyModerator, AzureContentSafetyModeratorOptions

from config import Config

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise RuntimeError("Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set.")

print(config.__dict__)

model: OpenAIModel
moderator: Moderator

if config.OPENAI_KEY:
    model = OpenAIModel(
        OpenAIModelOptions(
            api_key=config.OPENAI_KEY,
            default_model="gpt-3.5-turbo"
        ))
    moderator = OpenAIModerator(
        OpenAIModeratorOptions(
            api_key=config.OPENAI_KEY,
            moderate="both",
        )   
    )
elif config.AZURE_OPENAI_KEY and config.AZURE_OPENAI_ENDPOINT:
     model = OpenAIModel(
        AzureOpenAIModelOptions(
            api_key=config.AZURE_OPENAI_KEY,
            default_model="gpt-35-turbo",
            api_version="2023-03-15-preview",
            endpoint=config.AZURE_OPENAI_ENDPOINT
        ))
     moderator = AzureContentSafetyModerator(
         AzureContentSafetyModeratorOptions(
             api_key=config.AZURE_CONTENT_SAFETY_KEY,
             moderate="both",
             api_version="2023-04-30-preview",
             endpoint=config.AZURE_CONTENT_SAFETY_ENDPOINT
         )
     )

prompts = PromptManager(
    PromptManagerOptions(
        prompts_folder=f"{os.path.dirname(os.path.abspath(__file__))}/prompts")
    )

planner = ActionPlanner(
    ActionPlannerOptions(
        model=model,
        prompts=prompts,
        default_prompt='chat'
    )
)

storage = MemoryStorage()
app = Application[TurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        ai=AIOptions(
            planner=planner,
            moderator=moderator,
        ),
    )
)

@app.message("/reset")
async def on_reset(context: TurnContext, state: TurnState):
    del state.conversation
    await context.send_activity("Ok let's start this over")
    return True

@app.ai.action(ActionTypes.FLAGGED_INPUT)
async def on_flagged_input(context: ActionTurnContext, state: TurnState):
    message = ""
    if context.data:
        data = context.data
        if data["categories"]["hate"]:
            message += f"<strong>Hate speech</strong> detected. Severity: {data['category_scores']['hate']}. "
        if data["categories"]["sexual"]:
            message += f"<strong>Sexual content</strong> detected. Severity: {data['category_scores']['sexual']}. "
        if data["categories"]["self_harm"]:
            message += f"<strong>Self harm</strong> detected. Severity: {data['category_scores']['self_harm']}. "
        if data["categories"]["violence"]:
            message += f"<strong>Violence</strong> detected. Severity: {data['category_scores']['violence']}. "
    await context.send_activity(f"I'm sorry your message was flagged due to triggering OpenAI’s content management policy. Reason: {message}")
    return ActionTypes.STOP

@app.ai.action(ActionTypes.FLAGGED_OUTPUT)
async def on_flagged_output(context: TurnContext, state: TurnState):
    await context.send_activity("I'm not allowed to talk about such things.")
    return ActionTypes.STOP

@app.ai.action(ActionTypes.HTTP_ERROR)
async def on_http_error(context: TurnContext, state: TurnState):
    await context.send_activity("An AI request failed. Please try again later")
    return ActionTypes.STOP

@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
