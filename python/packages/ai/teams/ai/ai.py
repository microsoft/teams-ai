"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from datetime import datetime
from logging import Logger
from typing import Any, Callable, Dict, Generic, Optional, TypeVar

from botbuilder.core import TurnContext
from botbuilder.schema import Activity, ActivityTypes
from botframework.connector import Channels

from ..app_error import ApplicationError
from ..state import TurnState
from ..utils import snippet
from ..utils.citations import format_citations_response, get_used_citations
from .actions import ActionEntry, ActionHandler, ActionTurnContext, ActionTypes
from .ai_options import AIOptions
from .citations.citations import AIEntity, Appearance, ClientCitation
from .moderators.moderator import Moderator
from .planners.plan import Plan, PredictedDoCommand, PredictedSayCommand
from .planners.planner import Planner
from .prompts import MessageContext

StateT = TypeVar("StateT", bound=TurnState)


class AI(Generic[StateT]):
    """
    ### AI System

    The AI system is responsible for generating plans, moderating input and output, and
    generating prompts. It can be used free standing or routed to by the Application object.
    """

    _options: AIOptions
    _logger: Logger
    _actions: Dict[str, ActionEntry[StateT]] = {}

    @property
    def options(self) -> AIOptions:
        return self._options

    @property
    def planner(self) -> Planner[StateT]:
        return self._options.planner

    @property
    def moderator(self) -> Moderator[StateT]:
        return self._options.moderator

    def __init__(self, options: AIOptions, *, logger=Logger("teams.ai")) -> None:
        self._options = options
        self._logger = logger
        self._actions = {
            ActionTypes.UNKNOWN_ACTION: ActionEntry[StateT](
                ActionTypes.UNKNOWN_ACTION, True, self._on_unknown_action
            ),
            ActionTypes.FLAGGED_INPUT: ActionEntry[StateT](
                ActionTypes.FLAGGED_INPUT, True, self._on_flagged_input
            ),
            ActionTypes.FLAGGED_OUTPUT: ActionEntry[StateT](
                ActionTypes.FLAGGED_OUTPUT, True, self._on_flagged_output
            ),
            ActionTypes.HTTP_ERROR: ActionEntry[StateT](
                ActionTypes.HTTP_ERROR, True, self._on_http_error
            ),
            ActionTypes.PLAN_READY: ActionEntry[StateT](
                ActionTypes.PLAN_READY, True, self._on_plan_ready
            ),
            ActionTypes.DO_COMMAND: ActionEntry[StateT](
                ActionTypes.DO_COMMAND, True, self._on_do_command
            ),
            ActionTypes.SAY_COMMAND: ActionEntry[StateT](
                ActionTypes.SAY_COMMAND, True, self._on_say_command
            ),
            ActionTypes.TOO_MANY_STEPS: ActionEntry[StateT](
                ActionTypes.TOO_MANY_STEPS, True, self._on_too_many_steps
            ),
        }

    def action(
        self, name: Optional[str] = None, *, allow_overrides=False
    ) -> Callable[[ActionHandler[StateT]], ActionHandler[StateT]]:
        """
        Registers a new action event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.ai.action()
        async def hello_world(context: TurnContext, state: TurnState, entities: Any, name: str):
            print("hello world!")
            return True

        # Pass a function to this method
        app.ai.action()(hello_world)
        ```

        #### Args:
        - `name`: The name of the action `Default: Function Name`
        - `allow_overrides`: If it should throw an error when duplicates
        are found `Default: False`
        """

        def __call__(func: ActionHandler[StateT]) -> ActionHandler[StateT]:
            action_name = name

            if not action_name:
                action_name = func.__name__

            existing = self._actions.get(action_name)

            if existing and not existing.allow_overrides:
                raise ApplicationError(f"""
                    The AI.action() method was called with a previously
                    registered action named \"{action_name}\".
                    """)

            self._actions[action_name] = ActionEntry[StateT](action_name, allow_overrides, func)
            return func

        return __call__

    async def run(
        self,
        context: TurnContext,
        state: StateT,
        started_at: datetime = datetime.now(),
        step: int = 0,
    ) -> bool:
        """
        Calls the configured planner to generate a plan and executes the plan that is returned.
        """

        plan: Optional[Plan] = None

        if step == 0:
            plan = await self.moderator.review_input(context, state)

        if plan is None:
            if step == 0:
                plan = await self.planner.begin_task(context, state)
            else:
                plan = await self.planner.continue_task(context, state)

            plan = await self.moderator.review_output(context, state, plan)

        res = await self._actions[ActionTypes.PLAN_READY].invoke(
            context, state, plan, ActionTypes.PLAN_READY
        )

        if res == ActionTypes.STOP:
            return False

        loop = False

        for command in plan.commands:
            step += 1
            output = ""

            if isinstance(command, PredictedDoCommand):
                if command.action in self._actions:
                    output = await self._actions[ActionTypes.DO_COMMAND].invoke(
                        context, state, command, command.action
                    )
                    loop = len(output) > 0
                    state.temp.action_outputs[command.action] = output
                else:
                    output = await self._actions[ActionTypes.UNKNOWN_ACTION].invoke(
                        context, state, plan, command.action
                    )
            elif isinstance(command, PredictedSayCommand):
                loop = False
                output = await self._actions[ActionTypes.SAY_COMMAND].invoke(
                    context, state, command, ActionTypes.SAY_COMMAND
                )
            else:
                raise ApplicationError(f"unknown command of type {command.type} predicted")

            if output == ActionTypes.STOP:
                return False

            state.temp.last_output = output
            state.temp.input = output
            state.temp.input_files = []

        if loop and self._options.allow_looping:
            return await self.run(context, state, started_at, step)

        return True

    async def _on_unknown_action(
        self,
        context: ActionTurnContext,
        _state: StateT,
    ) -> str:
        self._logger.error(
            'An AI action named "%s" was predicted but no handler was registered', context.name
        )
        return ActionTypes.STOP

    async def _on_flagged_input(
        self,
        context: ActionTurnContext,
        _state: StateT,
    ) -> str:
        self._logger.error(
            "The users input has been moderated but no handler was registered for %s", context.name
        )
        return ActionTypes.STOP

    async def _on_flagged_output(
        self,
        context: ActionTurnContext,
        _state: StateT,
    ) -> str:
        self._logger.error(
            "The apps output has been moderated but no handler was registered for %s", context.name
        )
        return ActionTypes.STOP

    async def _on_http_error(
        self,
        _context: ActionTurnContext[dict],
        _state: StateT,
    ) -> str:
        status = _context.data.get("status")
        message = _context.data.get("message")
        raise ApplicationError(
            "An AI request failed because an http error occurred. "
            f"Status code:{status}. Message:{message}"
        )

    async def _on_plan_ready(
        self,
        context: ActionTurnContext[Plan],
        _state: StateT,
    ) -> str:
        return "" if len(context.data.commands) > 0 else ActionTypes.STOP

    async def _on_do_command(
        self,
        context: ActionTurnContext[PredictedDoCommand],
        state: StateT,
    ) -> str:
        action = self._actions.get(context.data.action)
        ctx = ActionTurnContext(context.data.action, context.data.parameters, context)

        if not action:
            return await self._on_unknown_action(ctx, state)

        return await action.invoke(context, state, context.data.parameters, context.name)

    async def _on_say_command(
        self,
        context: ActionTurnContext[PredictedSayCommand],
        _state: StateT,
    ) -> str:
        content = (
            context.data.response.content
            if context.data.response and context.data.response.content
            else ""
        )
        msg_context = (
            context.data.response.context
            if context.data.response and context.data.response.context
            else None
        )
        is_teams_channel = context.activity.channel_id == Channels.ms_teams

        if not content:
            return ""

        if is_teams_channel:
            content = content.replace("\n", "<br>")

        # If the response from AI includes citations,
        # those citations will be parsed and added to the SAY command.
        citations = []

        if (
            msg_context
            and isinstance(msg_context, MessageContext)
            and len(msg_context.citations) > 0
        ):
            for i, citation in enumerate(msg_context.citations):
                citations.append(
                    ClientCitation(
                        position=f"{i + 1}",
                        appearance=Appearance(
                            name=citation.title or f"Document {i + 1}",
                            abstract=snippet(citation.content, 500),
                        ),
                    )
                )

        # If there are citations, modify the content so that the sources are numbers
        # instead of [doc1], [doc2], etc.
        content_text = content if not citations else format_citations_response(content)

        # If there are citations, filter out the citations unused in content.
        referenced_citations = get_used_citations(content_text, citations)
        channel_data = {}

        if is_teams_channel:
            channel_data["feedbackLoopEnabled"] = self._options.enable_feedback_loop

        await context.send_activity(
            Activity(
                type=ActivityTypes.message,
                text=content_text,
                channel_data=channel_data,
                entities=[
                    AIEntity(
                        citation=(list(referenced_citations) if referenced_citations else []),
                        additional_type=["AIGeneratedContent"],
                    ),
                ],
            )
        )

        return ""

    async def _on_too_many_steps(
        self,
        _context: ActionTurnContext,
        _state: StateT,
    ) -> str:
        self._logger.error("The run retrieval for the Assistants Planner has expired.")
        return ActionTypes.STOP

    async def do_action(
        self,
        context: TurnContext,
        state: StateT,
        action: str,
        parameters: Optional[Dict[str, Any]] = None,
    ) -> str:
        """
        Manually executes a named action.

        Args:
            context (TurnContext): Current turn context.
            state (StateT): Current turn state.
            action (str): Name of the action to execute.
            parameters (Optional[Dict[str, Any]]): Optional. Entities to pass to the action.

        Returns:
            str: The result of the action.
        """
        if action not in self._actions:
            raise ApplicationError(f"Can't find an action named '{action}'.")

        action_entry = self._actions[action]
        return await action_entry.invoke(context, state, parameters, action)
