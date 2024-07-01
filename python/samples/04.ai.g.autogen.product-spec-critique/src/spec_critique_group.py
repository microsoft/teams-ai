from typing import Union, Dict
from autogen import AssistantAgent, GroupChat, Agent

from botbuilder.core import TurnContext

from config import Config
from state import AppTurnState

config = Config()

# TeamsDownloader currently has an issue where it can't download files from `download_url`
def download_file_and_return_contents(download_url):
    import requests
    response = requests.get(download_url, timeout=30)
    return response.text

class AnswererAgent(AssistantAgent):
     def __init__(self, spec_details: Union[str, None], *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.spec_details = spec_details

        def add_spec_to_message(messages):
            messages = messages.copy()
            if self.spec_details:
                messages.append({"content": f'Here is the spec: {self.spec_details}', "role": "user"})
            else:
                messages.append({"content": "No spec details provided. Ask the user to provide you one.", "role": "user"})
            return messages
        self.hook_lists["process_all_messages_before_reply"].append(
            add_spec_to_message)
        
class SpecCritiqueGroup:
    def __init__(self, llm_config: Dict, criteria: str = """
1. Clear identification of the audience 
2. Clear identification of the problem 
3. Clear identification of the solution 
4. Clear identification of the value proposition 
5. Clear identification of the competition 
6. Clear identification of the unique selling proposition 
7. Clear identification of the call to action. 
"""):
        self.criteria = criteria
        self.llm_config = llm_config
        
    async def build_group_chat(self, context: TurnContext, state: AppTurnState, user_agent: Agent):
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
                    state.conversation.spec_details = spect_details
                    await state.conversation.save(context)
            
        group_chat_agents = [user_agent]
        questioner_agent = AssistantAgent(
            name="Questioner",
            system_message=f"""You are a questioner agent. 
Your role is to ask questions for a product spec that the Answerer agent has.
As questions based on these requirements:
{self.criteria}
Ask a single question at a given time.

When asking the question, you should include the spec requirement that the question is trying to answer. For example:
<QUESTION requirement=1>
Your question here
</QUESTION>

If you have no questions to ask, say "NO_QUESTIONS" and nothing else.
            """,
            llm_config={"config_list": [self.llm_config], "timeout": 60, "temperature": 0},
        )
        answerer_agent = AnswererAgent(
            name="Answerer",
            system_message="""You are an answerer agent. 
Your role is to answer questions based on the product specs requirements. 
Answer the questions as clearly and concisely as possible.

Your answers MUST be factual and only backed by the facts presented in the product spec or by clarifying responses from the user. Do NOT use facts that are not in the spec or in clarifying responses by the user.
If you do not understand something from the spec or it is not described in the spec, you may ask a clarifying question for the user. In these cases, only include the clarifying question in the following format in your response:
<CLARIFYING_QUESTION>
Question for the user
</CLARIFYING_QUESTION>
            """,
            
            llm_config={"config_list": [self.llm_config], "timeout": 60, "temperature": 0},
            spec_details=spect_details
        )
        
        answer_evaluator_agent = AssistantAgent(
            name="Overall_spec_evaluator",
            system_message=f"""You are an answer reviewer agent. 
Your role is to evaluate the answers given by the answerer agent.
You are only called if the Questioner agent has no more questions to ask. 
Provide details on the quality of the specs based on the answers given by the answerer agent.
Evaluate the answers based on the following spec criteria:
{self.criteria}

Provide some actionable feedback to the answerer agent on how they can improve their answers. If the answers are good, provide positive feedback instead.
            """,
            llm_config={"config_list": [self.llm_config], "timeout": 60, "temperature": 0},
        )

        for agent in [questioner_agent, answerer_agent, answer_evaluator_agent]:
            group_chat_agents.append(agent)
            
        def custom_speaker_selection_func(
                last_speaker: Agent, groupchat: GroupChat
            ) -> Union[Agent, str, None]:
            last_message = groupchat.messages[-1]
            content = last_message.get("content")
            if last_speaker == questioner_agent:
                if content is not None and "NO_QUESTIONS" in content:
                    print("Switching to answer evaluator agent")
                    return answer_evaluator_agent
                else:
                    return answerer_agent
            elif last_speaker == answerer_agent:
                if content is not None and '<CLARIFYING_QUESTION>' in content:
                    print("Sending clarifying question for user")
                    return user_agent
                else:
                    return questioner_agent
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