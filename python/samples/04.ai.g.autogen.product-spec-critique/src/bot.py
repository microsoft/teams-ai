"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.

Description: initialize the app and listen for `message` activitys
"""

import os
import sys
import traceback
from typing import Union
from autogen import AssistantAgent, GroupChat, Agent
from botbuilder.schema import Activity, ActivityTypes

from botbuilder.core import TurnContext, MemoryStorage
from teams import Application, ApplicationOptions, TeamsAdapter
from teams.ai import AIOptions
from teams.ai.actions import ActionTypes, ActionTurnContext
from teams.input_file import InputFile
from autogen_planner import AutoGenPlanner, PredictedSayCommandWithAttachments

from config import Config
from state import AppTurnState

config = Config()

if config.OPENAI_KEY is None and config.AZURE_OPENAI_KEY is None:
    raise RuntimeError(
        "Missing environment variables - please check that OPENAI_KEY or AZURE_OPENAI_KEY is set."
    )


llm_config = {"model": "gpt-4o", "api_key": os.environ["OPENAI_KEY"]}
# downloads the file and returns the contents in a string
def download_file_and_return_contents(download_url):
    import requests
    response = requests.get(download_url)
    return response.text
    

storage = MemoryStorage()

class AnswererAgent(AssistantAgent):
     def __init__(self, spec_details: str | None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spec_details = spec_details

        def add_spec_to_message(messages):
            messages = messages.copy()
            if self.spec_details:
                messages.append({"content": self.spec_details, "role": "user"})
            else:
                messages.append({"content": "No spec details provided. Ask the user to provide you one.", "role": "user"})
            return messages
        self.hook_lists["process_all_messages_before_reply"].append(
            add_spec_to_message)

pm_spec_criteria = f"""
1. Clear identification of the audience 
2. Clear identification of the problem 
3. Clear identification of the solution 
4. Clear identification of the value proposition 
5. Clear identification of the competition 
6. Clear identification of the unique selling proposition 
7. Clear identification of the call to action. 
"""
def build_group_chat(context: TurnContext, state: AppTurnState, user_agent: Agent):
    # If the spec is sent as a md file, we can use
    spect_details = state.conversation.spec_details
    if context.activity.attachments:
        first_attachment = context.activity.attachments[0]
        content = first_attachment.content
        if isinstance(content, dict):
            content_type = content.get('fileType')
            if content_type == "md":
                download_url = content.get('downloadUrl')
                spect_details = download_file_and_return_contents(download_url)
                state.conversation.spect_details = spect_details
    
    # def read_spec() -> str:
    #     # this would probably be RAG in production
    #     return  download_file_and_return_contents(spec_url)
        
    group_chat_agents = [user_agent]
    questioner_agent = AssistantAgent(
        name="Questioner",
        system_message=f"""You are a questioner agent. 
Your role is to ask questions for product specs based on the these requirements: 
{pm_spec_criteria}
Ask a single question at a given time. 
If you do not have any more questions, say so.

When asking the question, you should include the spec requirement that the question is trying to answer. For example:
<question> (for spec requirement 1)

If you have no questions to ask, say "NO_QUESTIONS" and nothing else.
        """,
        llm_config={"config_list": [llm_config], "timeout": 60, "temperature": 0},
    )
    answerer_agent = AnswererAgent(
        name="Answerer",
        system_message=f"""You are an answerer agent. 
Your role is to answer questions based on the product specs requirements. 
If you do not understand something from the spec, you may ask a clarifying question. 
Answer the questions as clearly and concisely as possible.

DO NOT under any circumstance answer a question that is not based on the provided spec.
        """,
        
        llm_config={"config_list": [llm_config], "timeout": 60, "temperature": 0},
        spec_details=spect_details
    )
    # if spec_url:
    #     d_retrieve_content = answerer_agent.register_for_llm(
    #         description="Retrieve the contents of the product spec", api_style="function"
    #     )(read_spec)
    #     answerer_agent.register_for_execution()(d_retrieve_content)
    
    answer_evaluator_agent = AssistantAgent(
        name="Overall_spec_evaluator",
        system_message=f"""You are an answer reviewer agent. 
        Your role is to evaluate the answers given by the answerer agent.
        You are only called if the Questioner agent has no more questions to ask. 
        Provide details on the quality of the specs based on the answers given by the answerer agent.
        Evaluate the answers based on the following spec criteria:
        {pm_spec_criteria}
        
        Rate each area on a scale of 1 to 5 as well.
        """,
        llm_config={"config_list": [llm_config], "timeout": 60, "temperature": 0},
    )

    for agent in [questioner_agent, answerer_agent, answer_evaluator_agent]:
        group_chat_agents.append(agent)
        
    def custom_speaker_selection_func(
            last_speaker: Agent, groupchat: GroupChat
        ) -> Union[Agent, str, None]:
        if last_speaker == questioner_agent:
            last_message = groupchat.messages[-1]
            content = last_message.get("content")
            if content is not None and content.lower() == "no_questions":
                return answer_evaluator_agent
            else:
                return answerer_agent
        return 'auto'
            
    
    groupchat = GroupChat(
        agents=group_chat_agents,
        messages=[],
        max_round=100,
        speaker_selection_method=custom_speaker_selection_func,
        allowed_or_disallowed_speaker_transitions={
            user_agent: [questioner_agent],
            questioner_agent: [answerer_agent, answer_evaluator_agent],
            answerer_agent: [user_agent, questioner_agent],
            answer_evaluator_agent: [user_agent]
        },
        speaker_transitions_type="allowed"
    )
    return groupchat

app = Application[AppTurnState](
    ApplicationOptions(
        bot_app_id=config.APP_ID,
        storage=storage,
        adapter=TeamsAdapter(config),
        ai=AIOptions(planner=AutoGenPlanner(llm_config=llm_config, build_group_chat=build_group_chat)),
    ),
)

@app.ai.action(ActionTypes.SAY_COMMAND)
async def say_command(context: ActionTurnContext[PredictedSayCommandWithAttachments], state: AppTurnState):
    content = (
        context.data.response.content
        if context.data.response and context.data.response.content
        else ""
    )
    
    if content:
        await context.send_activity(
            Activity(
                type=ActivityTypes.message,
                text=content,
                attachments=context.data.response.attachments,
                entities=[
                    {
                        "type": "https://schema.org/Message",
                        "@type": "Message",
                        "@context": "https://schema.org",
                        "@id": "",
                        "additionalType": ["AIGeneratedContent"],
                    }
                ],
            )
        )

    return ""

@app.message("/clear")
async def on_login(context: TurnContext, state: AppTurnState):
    await state.conversation.clear(context)
    await context.send_activity("Cleared and ready to analyze next spec")
    
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
