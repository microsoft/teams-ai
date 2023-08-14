"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
import json
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

from teams.ai.exceptions import AIException

from .command_type import CommandType
from .plan import Plan
from .predicted_command import PredictedCommand
from .predicted_do_command import PredictedDoCommand
from .predicted_say_command import PredictedSayCommand


class DoCommandParseState(Enum):
    FIND_ACTION_NAME = 1
    IN_ACTION_NAME = 2
    FIND_ENTITY_NAME = 3
    IN_ENTITY_NAME = 4
    FIND_ENTITY_VALUE = 5
    IN_ENTITY_VALUE = 6
    IN_ENTITY_STRING_VALUE = 7
    IN_ENTITY_CONTENT_VALUE = 8


@dataclass
class ParsedCommandResult:
    length: int
    command: Optional[PredictedCommand]


BREAKING_CHARACTERS = "`~!@#$%^&*()_+-={}|[]\\:\";'<>?,./ \r\n\t"

NAME_BREAKING_CHARACTERS = "`~!@#$%^&*()+={}|[]\\:\";'<>?,./ \r\n\t"

SPACE_CHARACTERS = " \r\n\t"

COMMANDS = ["DO", "SAY"]

DEFAULT_COMMAND = "SAY"

IGNORED_TOKENS: List[str] = ["THEN"]


def parse_json(text: str) -> dict:
    """Parse a JSON string into an object.

    Args:
        text (str): The JSON string to parse.

    Returns:
        object: The parsed JSON object.
    """
    obj = None
    try:
        if text:
            start_json = text.find("{")
            end_json = text.rfind("}")
            if end_json > start_json >= 0:
                txt = text[start_json : end_json + 1]
                obj = json.loads(txt)
    except ValueError:
        pass

    return obj


def parse_response(text: str) -> Plan:
    """Parse a response into a Plan object.

    Args:
        text (str): The response to parse.

    Returns:
        Plan: The parsed Plan object.
    """
    obj = parse_json(text)
    if obj:
        plan = Plan.from_dict(obj)
        return plan

    responses = ""
    plan = Plan()
    tokens = _tokenize_text(text)
    if len(tokens) > 0:
        # Insert default command if response doesn't start with a command
        if tokens[0] not in COMMANDS:
            tokens = [DEFAULT_COMMAND] + tokens

        while len(tokens) > 0:
            result: ParsedCommandResult
            if tokens[0] == CommandType.DO.value:
                result = _parse_do_command(tokens)
            else:
                result = _parse_say_command(tokens)

            # Did we get a command back?
            if len(result) > 0:
                # Add command to list if generated
                # - In the case of `DO DO command` the first DO command wouldn't generate
                if result.command:
                    if isinstance(result.command, PredictedSayCommand):
                        response = result.command.response.strip().lower()
                        if response not in responses:
                            responses += " " + response
                            plan.commands.append(result.command)
                    else:
                        plan.commands.append(result.command)

                tokens = tokens[result.length :] if result.length < len(tokens) else []
            else:
                tokens = []

    return plan


def _parse_do_command(tokens: List[str]):
    length = 0
    command: PredictedDoCommand = None
    if len(tokens) > 1:
        if tokens[0] != "DO":
            raise AIException("Token list passed in doesn't start with 'DO' token.")

        action_name = ""
        entity_name = ""
        entity_value = ""
        quote_type = ""
        parse_state: DoCommandParseState = DoCommandParseState.FIND_ACTION_NAME

        while length < len(tokens):
            length += 1
            token = tokens[length]
            # Check for ignored tokens
            if token in IGNORED_TOKENS:
                continue

            # Stopp rocessing if a new command is hit
            # - Ignored if in a quoted string
            if token in COMMANDS and parse_state != DoCommandParseState.IN_ENTITY_STRING_VALUE:
                break

            # Check for beginning of another command
            if parse_state == DoCommandParseState.FIND_ACTION_NAME:
                # Ignore leading breaking characters
                if token not in BREAKING_CHARACTERS:
                    # Assign token to action name and enter new state
                    action_name = token
                    parse_state = DoCommandParseState.IN_ACTION_NAME
            elif parse_state == DoCommandParseState.IN_ACTION_NAME:
                # Accumulate tokens until you hit a breaking character
                # - Underscores and dashes are allowed
                if token in NAME_BREAKING_CHARACTERS:
                    # Initialize command object and enter new state
                    command = PredictedDoCommand("DO", action_name, {})
                    parse_state = DoCommandParseState.FIND_ENTITY_NAME
                else:
                    action_name += token
            elif parse_state == DoCommandParseState.FIND_ENTITY_NAME:
                # Ignore leading breaking characters
                if token not in BREAKING_CHARACTERS:
                    # Assign token to entity name and enter new state
                    entity_name = token
                    parse_state = DoCommandParseState.IN_ENTITY_NAME
            elif parse_state == DoCommandParseState.IN_ENTITY_NAME:
                # Accumulate tokens until you hit a breaking character
                # - Underscores and dashes are allowed
                if token in NAME_BREAKING_CHARACTERS:
                    # We know the entity name so now we need the value
                    parse_state = DoCommandParseState.FIND_ENTITY_VALUE
                else:
                    entity_name += token
            elif parse_state == DoCommandParseState.FIND_ENTITY_VALUE:
                # Look for either string quotes first non-space or equals token
                if token in ['"', "'", "`"]:
                    # Check for content value
                    if token == "`" and tokens[length + 1] == "`" and tokens[length + 2] == "`":
                        length += 2
                        parse_state = DoCommandParseState.IN_ENTITY_CONTENT_VALUE
                    else:
                        # Remember quote type and enter new state
                        quote_type = token
                        parse_state = DoCommandParseState.IN_ENTITY_STRING_VALUE
                elif token not in SPACE_CHARACTERS and token != "=":
                    # Assign token to value and enter new state
                    entity_value = token
                    parse_state = DoCommandParseState.IN_ENTITY_VALUE
            elif parse_state == DoCommandParseState.IN_ENTITY_STRING_VALUE:
                # The following code is checking that the tokens are
                # matching and is not exposing sensitive data
                # Accumulate tokens until end of string is hit
                if token == quote_type:
                    # Save pair and look for additional pairs
                    command.entities[entity_name] = entity_value
                    parse_state = DoCommandParseState.FIND_ENTITY_NAME
                    entity_name = entity_value = ""
                else:
                    entity_value += token
            elif parse_state == DoCommandParseState.IN_ENTITY_CONTENT_VALUE:
                if token == "`" and tokens[length + 1] == "`" and tokens[length + 2] == "`":
                    # Save pair and look for additional pairs
                    length += 2
                    command.entities[entity_name] = entity_value
                    parse_state = DoCommandParseState.FIND_ENTITY_NAME
                    entity_name = entity_value = ""
                else:
                    entity_value += token
            elif parse_state == DoCommandParseState.IN_ENTITY_VALUE:
                # Accumulate tokens until you hit a space
                if token in SPACE_CHARACTERS:
                    # Save pair and look for additional pairs
                    command.entities[entity_name] = entity_value
                    parse_state = DoCommandParseState.FIND_ENTITY_NAME
                    entity_name = entity_value = ""
                else:
                    entity_value += token

        # Create command if not created
        # - This happens when a DO command without any entities is at the end of the response.
        if not command and action_name:
            command = PredictedDoCommand("DO", action_name, {})

        # Append final entity
        if command and entity_name:
            command.entities[entity_name] = entity_value

    return ParsedCommandResult(length, command)


def _parse_say_command(tokens: List[str]):
    length = 0
    command = None
    if len(tokens) > 1:
        if tokens[0] != "SAY":
            raise AIException("Token list passed in doesn't start with 'SAY' token.")

        # Parse command (skips initial DO token)
        response = ""
        while length < len(tokens):
            length += 1
            # Check for ignored tokens
            token = tokens[length]
            if token in IGNORED_TOKENS:
                continue

            # Stop processing if a new command is hit
            if token in COMMANDS:
                break

            # Append token to output response
            response += token

        # Create command
        if len(response) > 0:
            command = PredictedSayCommand("SAY", response)

    return ParsedCommandResult(length, command)


def _tokenize_text(text: str) -> List[str]:
    tokens: List[str] = []
    if text:
        token = ""
        length = len(text)
        for i in range(length):
            char = text[i]
            if char in BREAKING_CHARACTERS:
                # Push token onto list
                if len(token) > 0:
                    tokens.append(token)

                # Push breaking character onto list as a separate token
                tokens.append(char)

                # Start a new empty token
                token = ""
            else:
                # Add to existing token
                token += char

        # Push last token onto list
        if len(token) > 0:
            tokens.append(token)

    return tokens
