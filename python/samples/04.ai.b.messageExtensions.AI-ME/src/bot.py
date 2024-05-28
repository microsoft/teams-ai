"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import traceback
from typing import Union

from botbuilder.core import MemoryStorage, TurnContext
from botbuilder.schema import Attachment
from botbuilder.schema.teams import MessagingExtensionResult, TaskModuleTaskInfo
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel, OpenAIModelOptions
from teams.ai.planners import ActionPlanner, ActionPlannerOptions
from teams.ai.prompts import PromptManager, PromptManagerOptions

from state import AppTurnState
from cards.edit_view import create_edit_view
from cards.initial_view import create_initial_view
from cards.post_card import create_post_card
from config import Config

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise Exception(
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

planner = ActionPlanner(ActionPlannerOptions(model, prompts, "generate"))

# Define storage and application
# Note that we're not passing AI options as we won't be chatting with the app.
storage = MemoryStorage()

app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        adapter=TeamsAdapter(config),
        storage=storage,
        long_running_messages=True,
    )
)

@app.turn_state_factory
async def turn_state_factory(context: TurnContext) -> AppTurnState:
    return await AppTurnState.load(context, storage)


# Implement Message Extension logic
@app.message_extensions.fetch_task("CreatePost")
async def create_post(context: TurnContext, _state: AppTurnState) -> TaskModuleTaskInfo:
    # Return card as a TaskInfo object
    card = create_initial_view()
    return create_task_info(card)


@app.message_extensions.submit_action("CreatePost")
async def submit_create_post(
    context: TurnContext, state: AppTurnState, data: dict
) -> Union[MessagingExtensionResult, TaskModuleTaskInfo]:
    try:
        if data["verb"] == "generate":
            # Call GPT and return response view
            return await update_post(context, state, "generate", data)
        elif data["verb"] == "update":
            # Call GPT and return an updated response view
            return await update_post(context, state, "update", data)
        elif data["verb"] == "post":
            attachments = [create_post_card(data["post"])] or None
            # Drop the card into compose window
            return MessagingExtensionResult(
                type="result", attachment_layout="list", attachments=attachments
            )
        raise RuntimeError("Invalid verb was used.")
    except Exception as err:
        raise RuntimeError(f"Something went wrong: {str(err)}")


# Creates a task module task info object with the given card.
def create_task_info(card: Attachment) -> TaskModuleTaskInfo:
    return TaskModuleTaskInfo(title="create Post", width="medium", height="medium", card=card)


# Updates a post with the given data and returns a task module task info object with the updated post.
async def update_post(
    context: TurnContext, state: AppTurnState, prompt: str, data: dict
) -> TaskModuleTaskInfo:
    # Create new or updated post
    state.temp.post = data.get("post", "")
    state.temp.prompt = data.get("prompt", "")
    response = await planner.complete_prompt(context, state, prompt)
    if response.status != "success":
        raise Exception(f"The request to OpenAI had the following error: {response.error}")

    # Return card
    if response.message is None:
        raise Exception("The response message is None")
    card = create_edit_view(response.message.content, False)
    return create_task_info(card)


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
