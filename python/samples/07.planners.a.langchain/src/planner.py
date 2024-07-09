import json
import sys
from logging import DEBUG, Logger, StreamHandler
from typing import Awaitable, Callable, Optional, Union

from botbuilder.core import TurnContext
from botbuilder.schema import Activity
from langchain.chat_models.base import BaseChatModel
from langchain_core.messages import AIMessageChunk, BaseMessageChunk
from teams.ai.planners import Plan, Planner, PredictedDoCommand, PredictedSayCommand
from teams.ai.prompts import PromptManager, PromptTemplate
from teams.ai.tokenizers import GPTTokenizer, Tokenizer

from message import Message
from state import AppTurnState

LangChainPlannerPromptFactory = Callable[
    [TurnContext, AppTurnState, "LangChainPlanner"], Awaitable[PromptTemplate]
]


class LangChainPlanner(Planner[AppTurnState]):
    model: BaseChatModel
    prompts: PromptManager
    tokenizer: Tokenizer

    _prompt_factory: LangChainPlannerPromptFactory
    _logger: Logger

    def __init__(
        self,
        *,
        model: BaseChatModel,
        prompts: PromptManager,
        tokenizer: Tokenizer = GPTTokenizer(),
        default_prompt: Union[str, LangChainPlannerPromptFactory] = "default",
        logger: Logger = Logger("langchain:planner", DEBUG),
    ) -> None:
        self.model = model
        self.prompts = prompts
        self.tokenizer = tokenizer
        self._logger = logger

        logger.addHandler(StreamHandler(sys.stdout))

        if isinstance(default_prompt, str):
            self._prompt_factory = self._default_prompt_factory(default_prompt)
        else:
            self._prompt_factory = default_prompt

    async def begin_task(self, context: TurnContext, state: AppTurnState) -> Plan:
        template = await self._prompt_factory(context, state, self)

        if len(state.conversation.history) == 0:
            system_prompt = await template.prompt.render_as_text(
                context,
                state,
                self.prompts,
                self.tokenizer,
                template.config.completion.max_input_tokens,
            )

            state.conversation.history.append(Message(role="system", content=system_prompt.output))

        state.conversation.history.append(Message(role="user", content=context.activity.text))
        return await self.complete_prompt(context, state, template)

    async def continue_task(self, context: TurnContext, state: AppTurnState) -> Plan:
        template = await self._prompt_factory(context, state, self)
        last_message = state.conversation.history[len(state.conversation.history) - 1]

        if last_message.role == "assistant" and last_message.tool_calls is not None:
            for call in last_message.tool_calls:
                name = call.get("name") or ""
                output = state.temp.action_outputs.get(name)
                state.conversation.history.append(
                    Message(role="tool", content=output, tool_call_id=call.get("id"))
                )

        return await self.complete_prompt(context, state, template)

    async def complete_prompt(
        self, context: TurnContext, state: AppTurnState, template: PromptTemplate
    ) -> Plan:
        self._logger.debug(
            "input => %s", state.conversation.history[len(state.conversation.history) - 1]
        )

        template = await self._prompt_factory(context, state, self)
        plan = Plan()
        res: Optional[BaseMessageChunk] = None
        activity_id: Optional[str] = None
        buffer: str = ""

        async for chunk in self.model.astream(
            [m.to_langchain() for m in state.conversation.history],
            tools=(
                [{"type": "function", "function": a.to_dict()} for a in template.actions]
                if template.actions is not None
                else []
            ),
        ):
            res = res + chunk if res is not None else chunk

            if isinstance(chunk.content, str):
                buffer += chunk.content

                if len(buffer) > 0:
                    activity_id = await self._upsert_activity(activity_id, buffer, context)

        if res is None or not isinstance(res, AIMessageChunk):
            return plan

        for call in res.tool_call_chunks:
            id = call.get("id")
            name = call.get("name")
            args = call.get("args")
            args = args if args is not None else "{}"

            if id is None or name is None:
                continue

            plan.commands.append(PredictedDoCommand(action=name, parameters=json.loads(args)))

        if isinstance(res.content, str) and res.content != "":
            plan.commands.append(
                PredictedSayCommand(response=Message(role="assistant", content=res.content))
            )

        state.conversation.history.append(Message.from_langchain(res))
        self._logger.debug(
            "output => %s", state.conversation.history[len(state.conversation.history) - 1]
        )

        return plan

    def _default_prompt_factory(self, name: str) -> LangChainPlannerPromptFactory:
        async def __factory__(
            _context: TurnContext, _state: AppTurnState, _planner: "LangChainPlanner"
        ) -> PromptTemplate:
            return await self.prompts.get_prompt(name)

        return __factory__

    async def _upsert_activity(self, id: Optional[str], text: str, context: TurnContext) -> str:
        if id is None:
            res = await context.send_activity(text)
            return res.id

        await context.update_activity(Activity(id=id, type="message", text=text))
        return id
