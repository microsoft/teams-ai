"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from logging import Logger
from typing import Any, Awaitable, Callable, Optional, cast

from aiohttp import ClientResponse, ClientResponseError, ClientSession
from aiohttp.web import Request, Response, WebSocketResponse
from botbuilder.core import Bot
from botbuilder.core.turn_context import TurnContext
from botbuilder.integration.aiohttp import (
    CloudAdapter,
    ConfigurationBotFrameworkAuthentication,
    ConfigurationServiceClientCredentialFactory,
)
from botbuilder.schema import Activity, ConversationAccount, ResourceResponse
from botframework.connector import (
    ConnectorClient,
    HttpClientBase,
    HttpRequest,
    HttpResponseBase,
)
from botframework.connector.auth import (
    AuthenticationConfiguration,
    ClaimsIdentity,
    HttpClientFactory,
    ServiceClientCredentialsFactory,
)
from botframework.connector.auth.connector_factory import ConnectorFactory
from botframework.connector.auth.user_token_client import UserTokenClient

from .user_agent import _UserAgent


class TeamsAdapter(CloudAdapter, _UserAgent):
    """
    An adapter that implements the Bot Framework Protocol
    and can be hosted in different cloud environments both public and private.
    """

    _credentials_factory: ServiceClientCredentialsFactory
    "The credentials factory used by the bot adapter to create a [ServiceClientCredentials] object."
    _configuration: Any

    @property
    def credentials_factory(self) -> ServiceClientCredentialsFactory:
        """
        The bot's credentials factory.
        """

        return self._credentials_factory

    @property
    def configuration(self) -> Any:
        """
        The bot's configuration.
        """

        return self._configuration

    def __init__(
        self,
        configuration: Any,
        *,
        credentials_factory: Optional[ServiceClientCredentialsFactory] = None,
        auth_configuration: Optional[AuthenticationConfiguration] = None,
        http_client_factory: Optional[HttpClientFactory] = None,
        logger: Optional[Logger] = None,
    ) -> None:
        """
        Initializes a new instance of the TeamsAdapter class.
        """

        super().__init__(
            ConfigurationBotFrameworkAuthentication(
                configuration,
                credentials_factory=cast(ServiceClientCredentialsFactory, credentials_factory),
                auth_configuration=cast(AuthenticationConfiguration, auth_configuration),
                http_client_factory=_TeamsHttpClientFactory(parent=http_client_factory),
                logger=cast(Logger, logger),
            )
        )

        self._configuration = configuration
        self._credentials_factory = (
            cast(ServiceClientCredentialsFactory, credentials_factory)
            if credentials_factory
            else ConfigurationServiceClientCredentialFactory(configuration)
        )

    async def process(
        self,
        request: Request,
        bot: Bot,
        ws_response: Optional[WebSocketResponse] = None,
    ) -> Optional[Response]:
        res = await super().process(
            request,
            bot,
            cast(WebSocketResponse, ws_response),
        )

        if res is not None:
            res.headers.add("User-Agent", self.user_agent)

        return res

    # [TODO] remove once version 4.15.1 is installed
    # https://github.com/microsoft/botbuilder-python/commit/bc3b6f4125e6f4ca5e6cae2dd25c62233e8ef508
    async def update_activity(self, context: TurnContext, activity: Activity):
        if not context:
            raise TypeError("Expected TurnContext but got None instead")

        if activity is None:
            raise TypeError("Expected Activity but got None instead")

        connector_client: ConnectorClient = cast(
            ConnectorClient, context.turn_state.get(self.BOT_CONNECTOR_CLIENT_KEY)
        )

        if not connector_client:
            raise ValueError("Unable to extract ConnectorClient from turn context.")

        response = await cast(
            Awaitable[Any],
            connector_client.conversations.update_activity(
                cast(ConversationAccount, activity.conversation).id,
                activity.id,
                activity,
            ),
        )

        response_id = getattr(response, "id") or None
        return ResourceResponse(id=response_id) if response_id else None

    def _create_turn_context(
        self,
        activity: Activity,
        claims_identity: ClaimsIdentity,
        oauth_scope: str,
        connector_client: ConnectorClient,
        user_token_client: UserTokenClient,
        logic: Callable[[TurnContext], Awaitable],
        connector_factory: ConnectorFactory,
    ) -> TurnContext:
        connector_client.config.add_user_agent(self.user_agent)
        connector_client.conversations.config.add_user_agent(self.user_agent)
        connector_client.attachments.config.add_user_agent(self.user_agent)

        return super()._create_turn_context(
            activity,
            claims_identity,
            oauth_scope,
            connector_client,
            user_token_client,
            logic,
            connector_factory,
        )


class _TeamsHttpClientFactory(HttpClientFactory):
    _parent: Optional[HttpClientFactory]

    def __init__(self, *, parent: Optional[HttpClientFactory] = None) -> None:
        self._parent = parent

    def create_client(self) -> HttpClientBase:
        if self._parent:
            return _TeamsHttpClient(parent=self._parent.create_client())

        return _TeamsHttpClient()


class _TeamsHttpClient(HttpClientBase, _UserAgent):
    _parent: Optional[HttpClientBase]

    def __init__(self, *, parent: Optional[HttpClientBase] = None) -> None:
        self._session = ClientSession()
        self._parent = parent

    async def post(self, *, request: HttpRequest) -> HttpResponseBase:
        request.headers["User-Agent"] = self.user_agent

        if self._parent:
            return await self._parent.post(request=request)

        aio_response = await self._session.post(
            request.request_uri,
            data=request.content,
            headers=request.headers,
        )

        return _TeamsHttpResponse(aio_response)


class _TeamsHttpResponse(HttpResponseBase):
    def __init__(self, client_response: ClientResponse) -> None:
        self._client_response = client_response

    @property
    def status_code(self):
        return self._client_response.status

    async def is_succesful(self) -> bool:
        try:
            self._client_response.raise_for_status()
            return True
        except ClientResponseError:
            return False

    async def read_content_str(self) -> str:
        return (await self._client_response.read()).decode()
