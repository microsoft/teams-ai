"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from typing import Any, Dict


class DefaultConversationState:
    """Default conversation state.

    Inherit a new interface from this base class to
    strongly type the applications conversation state.
    """

    _dict: Dict[str, Any]

    def __init__(self, data: Dict[str, Any]):
        """Initializes a new instance of the DefaultConversationState class.

        Args:
            data (Dict[str, Any]): The dictionary containing the conversation state data.
        """
        self._dict = data

    def get_dict(self) -> Dict[str, Any]:
        """Gets the dictionary containing the conversation state data.

        Returns:
            Dict[str, Any]: The dictionary containing the conversation state data.
        """
        return self._dict
