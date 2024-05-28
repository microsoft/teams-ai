"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import traceback
from typing import Optional

from botbuilder.core import MemoryStorage, TurnContext
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai.models import AzureOpenAIModelOptions, OpenAIModel, OpenAIModelOptions
from teams.ai.planners import ActionPlanner, ActionPlannerOptions
from teams.ai.prompts import PromptManager, PromptManagerOptions

from config import Config
from responses import (
    block_secret_word,
    last_guess,
    pick_secret_word,
    quit_game,
    start_game,
    you_lose,
    you_win,
)
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
    ),
)

planner = ActionPlanner[AppTurnState](
    ActionPlannerOptions(model=model, prompts=prompts, default_prompt="monologue")
)


@app.turn_state_factory
async def turn_state_factory(context: TurnContext):
    return await AppTurnState.load(context, storage)


@app.activity("message")
async def on_message(
    context: TurnContext,
    state: AppTurnState,
):
    secret_word = state.conversation.secret_word
    guess_count = state.conversation.guess_count
    remaining_guesses = state.conversation.remaining_guesses

    if secret_word and len(secret_word) < 1:
        raise ValueError("No secret word is assigned.")

    if secret_word:
        guess_count += 1
        remaining_guesses -= 1

        # Check for correct guess
        if secret_word.lower() in context.activity.text.lower():
            await context.send_activity(you_win(secret_word))
            secret_word = ""
            guess_count = remaining_guesses = 0
        elif remaining_guesses == 0:
            await context.send_activity(you_lose(secret_word))
            secret_word = ""
            guess_count = remaining_guesses = 0
        else:
            # Ask GPT for a hint
            response = await get_hint(context, state)
            if response and (secret_word.lower() in response.lower()):
                await context.send_activity(f"[{guess_count}] {block_secret_word()}")
            elif remaining_guesses == 1:
                await context.send_activity(f"[{guess_count}] {last_guess(response)}")
            else:
                await context.send_activity(f"[{guess_count}] {response}")
    else:
        # Start new game
        secret_word = pick_secret_word()
        guess_count = 0
        remaining_guesses = 20
        await context.send_activity(start_game())

    # Save game state
    state.conversation.secret_word = secret_word
    state.conversation.guess_count = guess_count
    state.conversation.remaining_guesses = remaining_guesses
    return True


@app.message("/quit")
async def on_quit(context: TurnContext, state: AppTurnState):
    secret_word = state.conversation.secret_word
    del state.conversation
    await context.send_activity(quit_game(secret_word))
    return True


async def get_hint(context: TurnContext, state: AppTurnState) -> Optional[str]:
    """
    Generates a hint for the user based on their input.
    Args:
        context (TurnContext): The current turn context.
        state (AppTurnState): The current turn state.
    Returns:
        str: A string containing the generated hint.
    Raises:
        Exception: If the request was rate limited.
    """
    state.temp.input = context.activity.text
    result = await planner.complete_prompt(context, state, "hint")

    if result.status != "success":
        raise ValueError(result.error)

    if result.message and result.message.content:
        return result.message.content

    return ""


@app.error
async def on_error(context: TurnContext, error: Exception):
    # This check writes out errors to console log .vs. app insights.
    # NOTE: In production environment, you should consider logging this to Azure
    #       application insights.
    print(f"\n [on_turn_error] unhandled error: {error}", file=sys.stderr)
    traceback.print_exc()

    # Send a message to the user
    await context.send_activity("The bot encountered an error or bug.")
