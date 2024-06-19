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
from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel
from teams.ai.planners import ActionPlanner, ActionPlannerOptions
from teams.ai.prompts import PromptManager, PromptManagerOptions

from config import Config
from state import AppTurnState

config = Config()

if config.AZURE_OPENAI_KEY is None:
    raise RuntimeError("Missing environment variables - please check that AZURE_OPENAI_KEY is set.")

# Create AI components
model: OpenAIModel

model = OpenAIModel(
    AzureOpenAIModelOptions(
        # Uncomment desired authentication method
        # api_key=config.AZURE_OPENAI_KEY,
        # azure_ad_token_provider=get_bearer_token_provider(DefaultAzureCredential(), 'https://cognitiveservices.azure.com/.default'),
        default_model="gpt-4o",
        api_version="2024-02-15-preview",
        endpoint=config.AZURE_OPENAI_ENDPOINT,
    )
)

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
            planner=ActionPlanner[AppTurnState](
                ActionPlannerOptions(model=model, prompts=prompts, default_prompt="chat")
            )
        ),
    ),
)


@app.conversation_update("membersAdded")
async def conversation_update(context: TurnContext, state: AppTurnState):
    await context.send_activity(
        "Welcome! I'm a conversational bot that can tell you about your data. You can also type `/clear` to clear the conversation history."
    )
    return True


@app.message("/clear")
async def message(context: TurnContext, state: AppTurnState):
    state.deleteConversationState()
    await context.send_activity(
        "New chat session started: Previous messages won't be used as context for new queries."
    )
    return True


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
