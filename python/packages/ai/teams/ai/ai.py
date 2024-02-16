"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from logging import Logger
from typing import (
    Any,
    Awaitable,
    Callable,
    Dict,
    Generic,
    Optional,
    TypeVar,
    Union,
    cast,
)

from botbuilder.core import CardFactory, MessageFactory, TurnContext
from botframework.connector import Channels

from ..app_error import ApplicationError
from .actions import ActionEntry, ActionHandler, ActionTurnContext, ActionTypes
from .ai_options import AIOptions
from .planner.plan import Plan
from .planner.predicted_do_command import PredictedDoCommand
from .planner.predicted_say_command import PredictedSayCommand
from .planner.response_parser import parse_adaptive_card
from .prompts.prompt_template import PromptTemplate
from .state import TurnState

StateT = TypeVar("StateT", bound=TurnState)


class AI(Generic[StateT]):
    """
    ### AI System

    The AI system is responsible for generating plans, moderating input and output, and
    generating prompts. It can be used free standing or routed to by the Application object.
    """

    _options: AIOptions
    _log: Logger
    _actions: Dict[str, ActionEntry[StateT]] = {}

    def __init__(self, options: AIOptions, *, log=Logger("teams.ai")) -> None:
        self._options = options
        self._log = log
        self._options.planner.log = log
        self._actions = {
            ActionTypes.UNKNOWN_ACTION: ActionEntry(
                ActionTypes.UNKNOWN_ACTION, True, self._on_unknown_action
            ),
            ActionTypes.FLAGGED_INPUT: ActionEntry(
                ActionTypes.FLAGGED_INPUT, True, self._on_flagged_input
            ),
            ActionTypes.FLAGGED_OUTPUT: ActionEntry(
                ActionTypes.FLAGGED_OUTPUT, True, self._on_flagged_output
            ),
            ActionTypes.HTTP_ERROR: ActionEntry(ActionTypes.HTTP_ERROR, True, self._on_http_error),
            ActionTypes.PLAN_READY: ActionEntry(ActionTypes.PLAN_READY, True, self._on_plan_ready),
            ActionTypes.DO_COMMAND: ActionEntry(ActionTypes.DO_COMMAND, True, self._on_do_command),
            ActionTypes.SAY_COMMAND: ActionEntry(
                ActionTypes.SAY_COMMAND, True, self._on_say_command
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
                raise ApplicationError(
                    f"""
                    The AI.action() method was called with a previously 
                    registered action named \"{action_name}\".
                    """
                )

            self._actions[action_name] = ActionEntry(action_name, allow_overrides, func)
            return func

        return __call__

    def function(
        self, name: Optional[str] = None, *, allow_overrides=False
    ) -> Callable[
        [Callable[[TurnContext, StateT], Awaitable[Any]]],
        Callable[[TurnContext, StateT], Awaitable[Any]],
    ]:
        """
        Registers a new prompt function event listener. This method can be used as either
        a decorator or a method.

        ```python
        # Use this method as a decorator
        @app.ai.function()
        async def hello_world(context: TurnContext, state: TurnState, entities: Any, name: str):
            print("hello world!")
            return True

        # Pass a function to this method
        app.ai.function()(hello_world)
        ```

        #### Args:
        - `name`: The name of the action `Default: Function Name`
        - `allow_overrides`: If it should throw an error when duplicates
        are found `Default: False`
        """

        def __call__(
            func: Callable[[TurnContext, StateT], Awaitable[Any]]
        ) -> Callable[[TurnContext, StateT], Awaitable[Any]]:
            func_name = name

            if not func_name:
                func_name = func.__name__

            self._options.planner.add_function(
                func_name,
                cast(
                    Callable[[TurnContext, TurnState], Awaitable[Any]],
                    func,
                ),
                allow_overrides=allow_overrides,
            )
            return func

        return __call__

    async def chain(
        self, context: TurnContext, state: StateT, prompt: Union[str, PromptTemplate]
    ) -> bool:
        """
        Chains into another prompt and executes the plan that is returned.

        This method is used to chain into another prompt. It will call the prompt manager to
        get the plan for the prompt and then execute the plan. The return value indicates whether
        that plan was completely executed or not, and can be used to make decisions about whether
        the outer plan should continue executing.
        """

        # TODO: call review_plan

        if state.temp.input == "":
            state.temp.input = context.activity.text

        if state.temp.history == "":
            state.temp.history = state.conversation.history.to_str(
                self._options.history.max_tokens,
                "cl100k_base",
                self._options.history.line_separator,
            )

        plan = await self._options.planner.generate_plan(
            context, state, prompt, history_options=self._options.history
        )

        plan_ready = self._actions.get(ActionTypes.PLAN_READY)

        if not plan_ready:
            return False

        is_ok = await plan_ready.invoke(context, state, plan)

        if not is_ok:
            return False

        if self._options.history.track_history:
            state.conversation.history.add(
                "user", state.temp.input.strip(), self._options.history.max_turns * 2
            )

            if self._options.history.assistant_history_type == "text":
                text = "\n".join(
                    map(
                        lambda cmd: PredictedSayCommand.from_dict(cmd.__dict__).response,
                        filter(lambda cmd: cmd.type == "SAY", plan.commands),
                    )
                )

                state.conversation.history.add("assistant", text)
            else:
                state.conversation.history.add("assistant", plan.json())

        for cmd in plan.commands:
            if isinstance(cmd, PredictedDoCommand):
                action = self._actions.get(ActionTypes.DO_COMMAND)

                if action:
                    is_ok = await action.invoke(context, state, cmd)
            elif isinstance(cmd, PredictedSayCommand):
                action = self._actions.get(ActionTypes.SAY_COMMAND)

                if action:
                    is_ok = await action.invoke(context, state, cmd)
            else:
                raise ApplicationError(f'unknown command type "{cmd.type}"')

            if not is_ok:
                return False

        return True

    async def _on_unknown_action(
        self,
        context: ActionTurnContext,
        _state: StateT,
    ) -> bool:
        self._log.error(
            'An AI action named "%s" was predicted but no handler was registered', context.name
        )
        return True

    async def _on_flagged_input(
        self,
        context: ActionTurnContext,
        _state: StateT,
    ) -> bool:
        self._log.error(
            "The users input has been moderated but no handler was registered for %s", context.name
        )
        return True

    async def _on_flagged_output(
        self,
        context: ActionTurnContext,
        _state: StateT,
    ) -> bool:
        self._log.error(
            "The apps output has been moderated but no handler was registered for %s", context.name
        )
        return True

    async def _on_http_error(
        self,
        _context: ActionTurnContext[dict],
        _state: StateT,
    ) -> bool:
        status = _context.data.get("status")
        message = _context.data.get("message")
        raise ApplicationError(
            (
                "An AI request failed because an http error occurred. "
                f"Status code:{status}. Message:{message}"
            )
        )

    async def _on_plan_ready(
        self,
        context: ActionTurnContext[Plan],
        _state: StateT,
    ) -> bool:
        return len(context.data.commands) > 0

    async def _on_do_command(
        self,
        context: ActionTurnContext[PredictedDoCommand],
        state: StateT,
    ) -> bool:
        action = self._actions.get(context.data.action)
        ctx = ActionTurnContext(context.data.action, context.data.parameters, context)

        if not action:
            return await self._on_unknown_action(ctx, state)

        return await action.func(ctx, state)

    async def _on_say_command(
        self,
        context: ActionTurnContext[PredictedSayCommand],
        _state: StateT,
    ) -> bool:
        response = context.data.response
        card = parse_adaptive_card(response)

        if card:  # Find adaptive card in response
            attachment = CardFactory.adaptive_card(card)
            activity = MessageFactory.attachment(attachment)
            await context.send_activity(activity)
        elif context.activity.channel_id == Channels.ms_teams:
            await context.send_activity(response.replace("\n", "<br>"))
        else:
            await context.send_activity(response)

        return True
