"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from botbuilder.core import TurnContext
from jsonschema import ValidationError, validate

from ...state import MemoryBase
from ...utils.json import parse
from ..models.prompt_response import PromptResponse
from ..tokenizers import Tokenizer
from .prompt_response_validator import PromptResponseValidator
from .validation import Validation

NEW_LINE = "\n"


class JSONResponseValidator(PromptResponseValidator):
    """
    Default response validator that always returns true.
    """

    _schema: Optional[Dict[str, Any]]
    _missing_json_feedback: str
    _error_feedback: str

    def __init__(
        self,
        schema: Optional[Dict[str, Any]] = None,
        missing_json_feedback: Optional[str] = None,
        error_feedback: Optional[str] = None,
    ) -> None:
        """
        Creates a new `JSONResponseValidator` instance.
        """

        super().__init__()
        self._schema = schema
        self._missing_json_feedback = (
            missing_json_feedback
            if missing_json_feedback is not None
            else "No valid JSON objects were found in the response. Return a valid JSON object."
        )
        self._error_feedback = (
            error_feedback
            if error_feedback is not None
            else "The JSON returned had errors. Apply these fixes:"
        )

    @property
    def schema(self):
        """
        JSON schema to validate the response against.
        """
        return self._schema

    @property
    def missing_json_feedback(self):
        """
        Feedback given when no JSON is returned.
        """
        return self._missing_json_feedback

    @property
    def error_feedback(self):
        """
        Feedback prefix given when schema errors are detected.
        """
        return self._error_feedback

    async def validate_response(
        self,
        context: TurnContext,
        memory: MemoryBase,
        tokenizer: Tokenizer,
        response: PromptResponse[str],
        remaining_attempts: int,
    ) -> Validation:
        message = response.message

        if message is None:
            return Validation(valid=False)

        content = message.content if message.content is not None else ""
        parsed = parse(content)

        if len(parsed) == 0:
            return Validation(valid=False, feedback=self.missing_json_feedback)

        if self._schema is None:
            return Validation(value=parsed.pop())

        parsed.reverse()
        errors: List[str] = []

        for obj in parsed:
            try:
                validate(instance=obj, schema=self._schema)
                return Validation(value=obj)
            except ValidationError as err:
                errors.append(err.message)

        return Validation(
            valid=False, feedback=f"{self._error_feedback}{NEW_LINE}{NEW_LINE.join(errors)}"
        )
