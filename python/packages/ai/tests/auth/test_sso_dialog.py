import unittest
from unittest.mock import MagicMock, patch, AsyncMock

from botbuilder.core import TurnContext
from botbuilder.dialogs import DialogTurnResult, DialogTurnStatus, WaterfallStepContext
from botbuilder.schema import Activity, ActivityTypes, ChannelAccount, ConversationAccount, SignInConstants
from msal import ConfidentialClientApplication

from teams.auth import SsoOptions, SsoDialog
from teams.state import TurnState

class TestSsoDialog(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.storage_mock = MagicMock()
        self.options = SsoOptions(
            scopes=["User.Read"],
            msal_config={
                "client_id": "client_id",
                "authority": "https://login.microsoftonline.com/common",
                "client_secret": "client_secret",
            },
            sign_in_link="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
            timeout=900000,
            end_on_invalid_message=True,
            storage=self.storage_mock
        )

        self.msal_app = MagicMock(spec=ConfidentialClientApplication)
        self.sso_dialog = SsoDialog("test_sso", self.options, self.msal_app)

        self.context = self.create_mock_context()
        self.state = await TurnState.load(self.context)

    def create_mock_context(self):
        context = MagicMock(spec=TurnContext)
        activity = MagicMock(spec=Activity)
        activity.type = ActivityTypes.message
        activity.text = "dummy_text"
        activity.channel_id = "msteams"
        activity.from_property = ChannelAccount(id="user_id", aad_object_id="aad_object_id")
        activity.conversation = ConversationAccount(id="conversation_id")
        activity.recipient = ChannelAccount(id="bot_id")
        activity.value = {"token": "dummy_token", "id": "dummy_id"}
        context.activity = activity
        return context

    async def test_is_sign_in_activity(self):
        self.context.activity.type = ActivityTypes.message
        self.context.activity.text = "dummy_text"
        result = self.sso_dialog.is_sign_in_activity(self.context.activity)
        self.assertTrue(result)

    async def test_sign_in_success(self):
        self.sso_dialog.run_dialog = AsyncMock(return_value=DialogTurnResult(DialogTurnStatus.Complete, result={"token": "new_access_token"}))
        self.sso_dialog.sign_out = AsyncMock()

        token = await self.sso_dialog.sign_in(self.context, self.state)

        self.sso_dialog.run_dialog.assert_called_once_with(self.context, self.state)
        self.sso_dialog.sign_out.assert_called_once_with(self.context, self.state)
        self.assertEqual(token, "new_access_token")

    async def test_sign_in_retry(self):
        # Enough side effects to handle recursion and termination
        self.sso_dialog.run_dialog = AsyncMock(side_effect=[
            DialogTurnResult(DialogTurnStatus.Complete, result=None),
            DialogTurnResult(DialogTurnStatus.Complete, result=None),
            DialogTurnResult(DialogTurnStatus.Complete, result=None),
            DialogTurnResult(DialogTurnStatus.Complete, result=None),
            DialogTurnResult(DialogTurnStatus.Complete, result={"token": "new_access_token"})
        ])
        self.sso_dialog.sign_out = AsyncMock()

        token = await self.sso_dialog.sign_in(self.context, self.state)

        self.assertEqual(self.sso_dialog.run_dialog.call_count, 5)
        self.sso_dialog.sign_out.assert_called_once_with(self.context, self.state)
        self.assertEqual(token, "new_access_token")

    async def test_sign_out(self):
        self.state.conversation[self.sso_dialog.id] = "dummy_value"
        await self.sso_dialog.sign_out(self.context, self.state)
        self.assertNotIn(self.sso_dialog.id, self.state.conversation)

    async def test_step_one(self):
        waterfall_step_context = MagicMock(spec=WaterfallStepContext)
        waterfall_step_context.begin_dialog = AsyncMock(return_value=DialogTurnResult(DialogTurnStatus.Waiting))

        result = await self.sso_dialog._step_one(waterfall_step_context)

        waterfall_step_context.begin_dialog.assert_called_once_with("TeamsSsoPrompt")
        self.assertEqual(result.status, DialogTurnStatus.Waiting)

    async def test_step_two(self):
        waterfall_step_context = MagicMock(spec=WaterfallStepContext)
        waterfall_step_context.result = {"token": "new_access_token"}
        waterfall_step_context.context.state.temp.duplicate_token_exchange = False

        self.sso_dialog._should_dedup = AsyncMock(return_value=False)

        result = await self.sso_dialog._step_two(waterfall_step_context)

        self.assertFalse(waterfall_step_context.context.state.temp.duplicate_token_exchange)
        self.assertEqual(result.status, DialogTurnStatus.Complete)

    async def test_should_dedup_conflict(self):
        self.context.activity.type = ActivityTypes.invoke
        self.context.activity.name = SignInConstants.token_exchange_operation_name
        self.context.activity.value["id"] = "dummy_id"
        self.storage_mock.write = AsyncMock(side_effect=Exception("eTag conflict"))

        result = await self.sso_dialog._should_dedup(self.context, self.state)

        self.assertTrue(result)

    async def test_get_storage_key(self):
        with self.assertRaises(ValueError):
            self.sso_dialog._get_storage_key(None)

        with self.assertRaises(ValueError):
            self.context.activity.type = ActivityTypes.message
            self.sso_dialog._get_storage_key(self.context)

        with self.assertRaises(ValueError):
            self.context.activity.type = ActivityTypes.invoke
            self.context.activity.name = "invalid_name"
            self.sso_dialog._get_storage_key(self.context)

        with self.assertRaises(ValueError):
            self.context.activity.name = SignInConstants.token_exchange_operation_name
            self.context.activity.value["id"] = None
            self.sso_dialog._get_storage_key(self.context)

        self.context.activity.value["id"] = "dummy_id"
        key = self.sso_dialog._get_storage_key(self.context)
        self.assertEqual(key, "msteams/conversation_id/dummy_id")

if __name__ == "__main__":
    unittest.main()
