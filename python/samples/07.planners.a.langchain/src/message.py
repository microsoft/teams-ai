from dataclasses import dataclass
from typing import List, Optional

from dataclasses_json import dataclass_json
from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolCall,
    ToolMessage,
)
from teams.ai.prompts import Message as TeamsAIMessage


@dataclass_json
@dataclass
class Message(TeamsAIMessage[str]):

    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None

    def to_langchain(self) -> BaseMessage:
        content = self.content if self.content is not None else ""

        if self.role == "system":
            return SystemMessage(content)
        elif self.role == "user":
            return HumanMessage(content)
        elif self.role == "assistant":
            return AIMessage(content, tool_calls=self.tool_calls)
        elif self.role == "tool":
            return ToolMessage(content, tool_call_id=self.tool_call_id)

        raise RuntimeError(f"invalid message role {self.role}")

    @classmethod
    def from_langchain(cls, message: BaseMessage) -> "Message":
        content = message.content if isinstance(message.content, str) else ""

        if isinstance(message, SystemMessage):
            return cls(role="system", content=content)
        elif isinstance(message, HumanMessage):
            return cls(role="user", content=content)
        elif isinstance(message, AIMessage):
            return cls(role="assistant", content=content, tool_calls=message.tool_calls)
        elif isinstance(message, ToolMessage):
            return cls(role="tool", content=content, tool_call_id=message.tool_call_id)

        raise RuntimeError(f"invalid message type {message.__class__}")
