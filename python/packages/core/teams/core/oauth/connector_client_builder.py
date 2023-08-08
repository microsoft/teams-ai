# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
from abc import ABC, abstractmethod

from teams.connector import ConnectorClient
from teams.connector.auth import ClaimsIdentity


class ConnectorClientBuilder(ABC):
    """
    Abstraction to build connector clients.
    """

    @abstractmethod
    async def create_connector_client(
        self, service_url: str, identity: ClaimsIdentity = None, audience: str = None
    ) -> ConnectorClient:
        """
        Creates the connector client asynchronous.

        :param service_url: The service URL.
        :param identity: The claims claimsIdentity.
        :param audience: The target audience for the connector.
        :return: ConnectorClient instance
        """
        raise NotImplementedError()
