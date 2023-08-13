"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""
import json

from .plan import Plan


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

    return Plan()
