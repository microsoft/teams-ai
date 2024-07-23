import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from datetime import datetime, timedelta
from botbuilder.core import TurnContext
from msal import ConfidentialClientApplication
from botbuilder.schema import Activity, ActivityTypes, ConversationAccount, ChannelAccount
from botbuilder.schema.teams import TeamsChannelAccount

from teams.state import TurnState
from teams.auth import SsoOptions, ConfidentialClientApplicationOptions
from teams.auth import SsoAuth

class TestSsoAuthTokenExchange(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.options = SsoOptions(
            scopes=["User.Read"],
            msal_config=ConfidentialClientApplicationOptions(
                client_id="client_id",
                authority="https://login.microsoftonline.com/common",
                client_secret="client_secret"
            ),
            sign_in_link="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            timeout=900000,
            end_on_invalid_message=True
        )

        self.context = self.create_mock_context()
        self.state = await TurnState.load(self.context)

        # Patch ConfidentialClientApplication before instantiating SsoAuth
        with patch('msal.ConfidentialClientApplication', autospec=True) as mock_msal:
            self.mock_msal_instance = mock_msal.return_value
            self.auth = SsoAuth(name="test_auth", options=self.options)
            self.auth._msal = self.mock_msal_instance  # Ensure the instance is patched

    def create_mock_context(self):
        context = MagicMock(spec=TurnContext)
        activity = MagicMock(spec=Activity)
        activity.type = ActivityTypes.invoke
        activity.channel_id = "msteams"
        activity.from_property = TeamsChannelAccount(id="user_id", aad_object_id="aad_object_id")
        activity.conversation = ConversationAccount(id="conversation_id")
        activity.recipient = ChannelAccount(id="bot_id")
        activity.value = {
            "token": "dummy_token",
            "id": "dummy_id"
        }
        context.activity = activity
        return context

    async def test_exchange_token_success(self):
        token_response = {
            "access_token": "new_access_token",
            "expires_on": datetime.utcnow() + timedelta(hours=1)
        }
        self.mock_msal_instance.acquire_token_on_behalf_of.return_value = token_response

        token_result = await self.auth.exchange_token(self.context, self.state)

        self.mock_msal_instance.acquire_token_on_behalf_of.assert_called_once_with(
            user_assertion="dummy_token",
            scopes=self.options.scopes
        )

        self.assertIsNotNone(token_result)
        self.assertEqual(token_result.token, "new_access_token")

    async def test_exchange_token_failure(self):
        self.mock_msal_instance.acquire_token_on_behalf_of.return_value = None

        token_result = await self.auth.exchange_token(self.context, self.state)

        self.mock_msal_instance.acquire_token_on_behalf_of.assert_called_once_with(
            user_assertion="dummy_token",
            scopes=self.options.scopes
        )

        self.assertIsNone(token_result)

if __name__ == '__main__':
    unittest.main()
