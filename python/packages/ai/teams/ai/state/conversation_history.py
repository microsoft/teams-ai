"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import List, Optional

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

    def to_str(self, max_tokens: int, delim="\n") -> str:
        value = ""

        for item in self:
            line = f"[{item.role}]: {item.content}{delim}"

            if len(value) + len(line) > max_tokens:
                break

            value += line

        return value.strip()
