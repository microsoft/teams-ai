"""
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional, Union, cast
from urllib.parse import quote
from uuid import uuid4

from botbuilder.core import CardFactory, MessageFactory, TurnContext
from botbuilder.dialogs import Dialog, DialogContext, PromptRecognizerResult
from botbuilder.schema import (
    Activity,
    ActivityTypes,
    InvokeResponse,
    OAuthCard,
    SignInConstants,
    TokenExchangeInvokeResponse,
    TokenResponse,
)
from botframework.connector.models import ActionTypes, CardAction
from botframework.connector.token_api.models import TokenExchangeResource
from msal import ConfidentialClientApplication

from .sso_options import SsoOptions


class SsoPrompt(Dialog):
    """
    Creates a new prompt that leverage Teams Single Sign On (SSO) support
    for bot to automatically sign in user and help receive oauth token.
    Asks the user to consent if needed.
    """

    _name: str
    _options: SsoOptions
    _msal: ConfidentialClientApplication

    def __init__(
        self, dialog_id: str, name: str, options: SsoOptions, msal: ConfidentialClientApplication
    ) -> None:
        super().__init__(dialog_id)
        self._name = name
        self._options = options
        self._msal = msal

    async def begin_dialog(self, dialog_context: "DialogContext", options: object = None):
        timeout: int = 900000

        if self._options.timeout:
            if self._options.timeout <= 0:
                raise ValueError(
                    "value of timeout property in teamsBotSsoPromptSettings should be positive."
                )
            timeout = self._options.timeout

        active_dialog = dialog_context.active_dialog

        if active_dialog:
            active_dialog.state["state"] = {}
            active_dialog.state["options"] = {}
            active_dialog.state["expires"] = datetime.now() + timedelta(seconds=timeout / 1000)

        token = await self.acquire_token_from_cache(dialog_context.context)

        if token:
            token_response = TokenResponse(
                connection_name="",
                token=token["access_token"],
                expiration=cast(datetime, token["expires_on"]).isoformat(),
            )
            return await dialog_context.end_dialog(token_response)

        # Cannot get token from cache, send OAuth card to get SSO token
        await self.send_oauth_card_async(dialog_context.context)
        return Dialog.end_of_turn

    async def acquire_token_from_cache(
        self, context: TurnContext
    ) -> Optional[dict[str, Union[str, Any]]]:
        aad_object_id = cast(str, getattr(context.activity.from_property, "aad_object_id"))

        if aad_object_id:
            accounts = self._msal.get_accounts()

            for account in accounts:
                if account["local_account_id"] == aad_object_id:
                    return self._msal.acquire_token_silent(
                        scopes=self._options.scopes, account=account
                    )

        return None

    async def continue_dialog(self, dialog_context: "DialogContext"):
        """
        Continue the current dialog based on the activity type and state,
        handling timeouts and token recognition.
        """
        state = None

        if dialog_context.active_dialog:
            state = dialog_context.active_dialog.state

        is_message = dialog_context.context.activity.type == ActivityTypes.message
        is_verify_activity = self._is_verify_state_activity(dialog_context.context)
        is_token_activity = self._is_exchange_activity(dialog_context.context)
        is_timeout_activity_type = is_message or is_verify_activity or is_token_activity
        has_timed_out = False

        if state:
            has_timed_out = is_timeout_activity_type and datetime.now() > cast(
                datetime, state["expires"]
            )

        if has_timed_out:
            return await dialog_context.end_dialog()

        if is_verify_activity or is_token_activity:
            recognized: PromptRecognizerResult = await self._recognize_token(dialog_context)

            if recognized.succeeded:
                return await dialog_context.end_dialog(recognized.value)

        if is_message and self._options.end_on_invalid_message:
            return await dialog_context.end_dialog()

        return Dialog.end_of_turn

    async def _recognize_token(self, dialog_context: DialogContext) -> PromptRecognizerResult:
        context = dialog_context.context
        token_response = None

        if self._is_exchange_activity(context):
            # Received activity is not a token exchange request
            if not (context.activity.value and self._is_exchange_activity(context.activity.value)):
                warning_message = (
                    "The bot received an InvokeActivity that is missing a"
                    " TokenExchangeInvokeRequest value. This is required to be sent with the"
                    " InvokeActivity."
                )
                await context.send_activity(
                    Activity(
                        type=ActivityTypes.invoke_response,
                        value=TokenExchangeInvokeResponse(
                            status=400, failure_detail=warning_message
                        ),
                    )
                )
            else:
                sso_token = context.activity.value.get("token")

                exchanged_token = self._msal.acquire_token_on_behalf_of(
                    user_assertion=sso_token, scopes=self._options.scopes
                )

                if exchanged_token:
                    await context.send_activity(
                        Activity(
                            type=ActivityTypes.invoke_response,
                            value=TokenExchangeInvokeResponse(
                                status=200, id=context.activity.value.get("id")
                            ),
                        )
                    )
                    access_token = exchanged_token.get("access_token")

                    if not access_token:
                        access_token = ""

                    expiry_date = cast(datetime, exchanged_token.get("expires_on"))
                    token_response = TokenResponse(
                        token=access_token, expiration=expiry_date.isoformat()
                    )

        if self._is_verify_state_activity(context):
            await self.send_oauth_card_async(context)
            await context.send_activity(
                Activity(type=ActivityTypes.invoke_response, value=InvokeResponse(status=200))
            )

        if token_response:
            return PromptRecognizerResult(succeeded=True, value=token_response)

        return PromptRecognizerResult()

    async def send_oauth_card_async(self, context: TurnContext):
        sign_in_resource = self._get_sign_in_resource()

        card = CardFactory.oauth_card(
            OAuthCard(
                text="Sign In",
                connection_name="",
                buttons=[
                    CardAction(
                        type=ActionTypes.signin,
                        title="Teams SSO Sign In",
                        value=sign_in_resource[0],
                    )
                ],
                token_exchange_resource=sign_in_resource[1],
            )
        )

        msg = MessageFactory.attachment(card)
        await context.send_activity(msg)

    def _get_sign_in_resource(self):
        client_id = self._options.msal_config.client_id
        scope = quote(" ".join(self._options.scopes), safe="~@#$&()*!+=:;,?/'")

        authority = self._options.msal_config.authority

        if not authority:
            authority = "https://login.microsoftonline.com/common/"

        link_components = authority.rsplit("/", 1)
        tenant_id = ""

        if link_components and len(link_components) > 1:
            tenant_id = link_components[1]

        sign_in_link = (
            f"{self._options.sign_in_link}?scope={scope}&clientId={client_id}&tenantId={tenant_id}"
        )

        token_exchange_resource = TokenExchangeResource(id=f"{uuid4()}-{self._name}")

        return (sign_in_link, token_exchange_resource)

    def _is_exchange_activity(self, context: TurnContext) -> bool:
        return context.activity.type == ActivityTypes.invoke and (
            context.activity.name == SignInConstants.token_exchange_operation_name
        )

    def _is_verify_state_activity(self, context: TurnContext) -> bool:
        return context.activity.type == ActivityTypes.invoke and (
            context.activity.name == SignInConstants.verify_state_operation_name
        )
