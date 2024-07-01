from autogen import ConversableAgent
from typing import Literal

class TeamsUserProxy(ConversableAgent):
    def __init__(self,
                 human_input_mode: Literal["ALWAYS",
                                           "TERMINATE", "NEVER"] = "ALWAYS",
                 **kwargs):
        super().__init__(human_input_mode=human_input_mode, **kwargs)
        self.question_for_user = None
        self.hook_lists['process_last_received_message'].append(
            self.is_user_question)

    def is_user_question(self, message: str) -> str:
        last_message = message
        is_question = True
        question = None
        if last_message is not None:
            ## If you want a smarter check for whether the last message is a question, you can use the following code,
            ## but by default, we can assume that all messages to the user are questions (in this example)
            
            # messages = [{"role": "assistant", "content": last_message}]
            # messages.append({
            #     "role": "user",
            #     "content": "Is the last message a question for the user? Please respond with 'yes' or 'no' and no other words.",
            # })
            # extracted_message = self._generate_oai_reply_from_client(
            #     self.client,
            #     messages,
            #     self.client_cache
            # )
            # if extracted_message is not None and isinstance(extracted_message, str):
            #     is_question = "yes" in extracted_message.lower()
            question = last_message

        if (is_question):
            self.question_for_user = question
        else:
            self.question_for_user = None
        return message

    # Since this UserProxy is designed to be used asynchrnously
    # we exit the conversation, then wait asynchronously for the next user message
    def get_human_input(self, _prompt) -> str:
        return 'exit'


