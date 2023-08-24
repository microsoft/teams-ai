"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Literal, Optional, Tuple

import tiktoken

from .message import Message, MessageRole
from .state_error import StateError


class ConversationHistory(List[Message]):
    """
    Conversation History State
    """

    def roles(self) -> List[MessageRole]:
        return list(map(lambda item: item.role, self))

    def contents(self) -> List[str]:
        return list(map(lambda item: item.content, self))

    def add(self, role: MessageRole, content: str, max_lines: int = 10) -> None:
        self.append(Message(role, content))

        if len(self) > max_lines:
            self.pop(0)

    def replace_last(self, role: MessageRole, content: str) -> None:
        if self.empty():
            raise StateError("conversation history is empty")

        self[len(self) - 1] = Message(role, content)

    def replace_last_of_role(self, of_role: MessageRole, role: MessageRole, content: str) -> None:
        i = self.last_index_of_role(of_role)

        if i == -1:
            raise StateError("conversation history is empty")

        self[i] = Message(role, content)

    def append_to_last(self, text: str) -> None:
        self[len(self) - 1].content += text

    def empty(self) -> bool:
        return len(self) == 0

    def len(self) -> int:
        return len(self)

    def first(self) -> Message:
        if self.empty():
            raise StateError("conversation history is empty")

        return self[0]

    def last(self) -> Message:
        if self.empty():
            raise StateError("conversation history is empty")

        return self[len(self) - 1]

    def last_of_role(self, role: MessageRole) -> Optional[Message]:
        i = self.last_index_of_role(role)

        if i == -1:
            return None

        return self[i]

    def last_index_of_role(self, role: MessageRole) -> int:
        for i in range(len(self) - 1, 0):
            if self[i].role == role:
                return i

        return -1

    def to_str(
        self, max_tokens: int, token_encoding: Literal["cl100k_base", "p50k_base"], delim="\n"
    ) -> str:
        """
        Returns a string representation of the conversation history.
        The string is limited to the specified number of tokens.

        Args:
            max_tokens (int): The maximum number of tokens to return.
            token_encoding (str): The token encoding to use. Available values are:
                                  "cl100k_base" for gpt-4 and gpt-3.5-turbo,
                                  "p50k_base" for text-davinci-002 and text-davinci-003.
            delim (str): The delimiter to use between lines. Defaults to "\n".

        Returns:
            str: The string representation of the conversation history.
        """

        value = ""
        encoding = tiktoken.get_encoding(token_encoding)

        text_tokens = 0
        for item in self:
            line = f"[{item.role}]: {item.content}{delim}"

            line_tokens = len(encoding.encode(line))
            text_tokens = text_tokens + line_tokens
            if text_tokens > max_tokens:
                break

            value += line

        return value.strip()

    def to_tuples(
        self, max_tokens: int, token_encoding: Literal["cl100k_base", "p50k_base"]
    ) -> List[Tuple[str, str]]:
        """
        Returns a list of tuples containing the role and content of each message in the history.

        Args:
            max_tokens (int): The maximum number of tokens for returned history.
            token_encoding (str): The encoding to use for tokenization. Available values are:
                                  "cl100k_base" for gpt-4 and gpt-3.5-turbo,
                                  "p50k_base" for text-davinci-002 and text-davinci-003.

        Returns:
            List[Tuple[str,str]]: A list of tuples containing the role and content
                                  of each message in the history.
        """

        encoding = tiktoken.get_encoding(token_encoding)

        # Populate up to max chars
        text_tokens = 0
        result: List[Tuple[str, str]] = []
        for i in range(len(self) - 1, -1, -1):
            # Ensure that adding line won't go over the max character length
            message = self[i]
            line_tokens = len(encoding.encode(message.content))
            text_tokens = text_tokens + line_tokens
            if text_tokens > max_tokens:
                break

            # Prepend line to output
            result.insert(0, (message.role, message.content))

        return result
