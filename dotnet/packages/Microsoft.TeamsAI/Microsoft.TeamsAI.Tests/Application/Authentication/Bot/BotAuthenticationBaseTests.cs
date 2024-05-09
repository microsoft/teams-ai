using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.Bot
{
    internal sealed class MockedBotAuthentication<TState> : BotAuthenticationBase<TState>
        where TState : TurnState, new()
    {
        private List<DialogTurnResult> _runDialogResult;
        private DialogTurnResult _continueDialogResult;
        private bool _throwExceptionWhenContinue;

        public MockedBotAuthentication(Application<TState> app, string name, List<DialogTurnResult>? runDialogResult = null, DialogTurnResult? continueDialogResult = null, bool throwExceptionWhenContinue = false) : base(app, name)
        {
            _runDialogResult = runDialogResult ?? new List<DialogTurnResult>();
            _continueDialogResult = continueDialogResult ?? new DialogTurnResult(DialogTurnStatus.Complete, new TokenResponse(token: "test token"));
            _throwExceptionWhenContinue = throwExceptionWhenContinue;
        }

        public override Task<DialogTurnResult> ContinueDialog(ITurnContext context, TState state, string dialogStateProperty, CancellationToken cancellationToken = default)
        {
            if (_throwExceptionWhenContinue)
            {
                throw new AuthException("mocked error");
            }
            return Task.FromResult(_continueDialogResult);
        }

        public override Task<DialogTurnResult> RunDialog(ITurnContext context, TState state, string dialogStateProperty, CancellationToken cancellationToken = default)
        {
            var result = _runDialogResult.FirstOrDefault();
            if (result == null)
            {
                result = new DialogTurnResult(DialogTurnStatus.Waiting);
            }
            else
            {
                _runDialogResult.RemoveAt(0);
            }
            return Task.FromResult(result);
        }
    }

    public class BotAuthenticationBaseTests
    {
        [Fact]
        public void Test_IsValidActivity_With_Valid_Activity()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test");
            var context = MockTurnContext();

            // act
            var validActivity = botAuth.IsValidActivity(context);

            // assert
            Assert.True(validActivity);
        }

        [Fact]
        public void Test_IsValidActivity_With_Invalid_Activity()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test");
            var context = MockTurnContext();
            context.Activity.Text = "";

            // act
            var validActivity = botAuth.IsValidActivity(context);

            // assert
            Assert.False(validActivity);

            // arrange
            context = MockTurnContext(ActivityTypes.Invoke);

            //  act
            validActivity = botAuth.IsValidActivity(context);

            // assert
            Assert.False(validActivity);
        }

        [Fact]
        public async void Test_Authenticate_Pending()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test");
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);

            // act
            var token = await botAuth.AuthenticateAsync(context, state);

            // assert
            var stateKey = "__fromId:test:Bot:AuthState__";
            var authState = state.Conversation[stateKey] as Dictionary<string, string>;
            Assert.Equal(null, token);
            Assert.NotNull(authState);
            Assert.True(authState.ContainsKey("message"));
            Assert.Equal("test text", authState["message"]);
        }

        [Fact]
        public async void Test_Authenticate_Complete()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", runDialogResult: new List<DialogTurnResult>() { new(DialogTurnStatus.Complete, new TokenResponse(token: "test token")) });
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);

            // act
            var token = await botAuth.AuthenticateAsync(context, state);

            // assert
            Assert.Equal("test token", token);
        }

        [Fact]
        public async void Test_Authenticate_CompleteWithoutToken()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", runDialogResult: new List<DialogTurnResult>() { new(DialogTurnStatus.Complete) });
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);

            // act
            var token = await botAuth.AuthenticateAsync(context, state);

            // assert
            Assert.Equal(null, token);
        }

        [Fact]
        public async void Test_HandleSignInActivity_Complete()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", continueDialogResult: new DialogTurnResult(DialogTurnStatus.Complete, new TokenResponse(token: "test token")));
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            state.Conversation["__fromId:test:Bot:AuthState__"] = new Dictionary<string, string>()
            {
                {"message", "test text" }
            };
            string actualToken = "";
            string messageText = "";
            botAuth.OnUserSignInSuccess((context, state) =>
            {
                actualToken = state.Temp.AuthTokens["test"];
                messageText = context.Activity.Text;
                return Task.CompletedTask;
            });
            botAuth.OnUserSignInFailure((context, state, exception) => { throw new AuthException("sign in failure handler should not be called"); });

            // act
            await botAuth.HandleSignInActivity(context, state, new CancellationToken());

            // assert
            Assert.Equal("test token", actualToken);
            Assert.Equal("test text", messageText);
        }

        [Fact]
        public async void Test_HandleSignInActivity_CompleteWithoutToken()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", continueDialogResult: new DialogTurnResult(DialogTurnStatus.Complete));
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            AuthException? authException = null;
            botAuth.OnUserSignInSuccess((context, state) => { throw new AuthException("sign in success handler should not be called"); });
            botAuth.OnUserSignInFailure((context, state, exception) => { authException = exception; return Task.CompletedTask; });

            // act
            await botAuth.HandleSignInActivity(context, state, new CancellationToken());

            // assert
            Assert.NotNull(authException);
            Assert.Equal("Authentication flow completed without a token.", authException.Message);
        }

        [Fact]
        public async void Test_HandleSignInActivity_ThrowException()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", throwExceptionWhenContinue: true);
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);
            AuthException? authException = null;
            botAuth.OnUserSignInSuccess((context, state) => { throw new AuthException("sign in success handler should not be called"); });
            botAuth.OnUserSignInFailure((context, state, exception) => { authException = exception; return Task.CompletedTask; });

            // act
            await botAuth.HandleSignInActivity(context, state, new CancellationToken());

            // assert
            Assert.NotNull(authException);
            Assert.Equal("Unexpected error encountered while signing in: mocked error.\nIncoming activity details: type: message, name: ", authException.Message);
        }

        [Fact]
        public void Test_SetSettingNameInContextActivityValue_NullContextActivityValue()
        {
            var context = MockTurnContext();

            // act
            BotAuthenticationBase<TurnState>.SetSettingNameInContextActivityValue(context, "settingNameValue");

            // assert
            Assert.NotNull(context.Activity.Value);
            Assert.Equal(((JObject)context.Activity.Value).GetValue("settingName")!.ToString(), "settingNameValue");
        }


        [Fact]
        public void Test_SetSettingNameInContextActivityValue_ExistingContextActivityValueObject()
        {
            var context = MockTurnContext();
            context.Activity.Value = new JObject();
            ((JObject)context.Activity.Value).Add("testKey", "testValue");

            // act
            BotAuthenticationBase<TurnState>.SetSettingNameInContextActivityValue(context, "settingNameValue");

            // assert
            Assert.NotNull(context.Activity.Value);

            var v = (JObject)context.Activity.Value;
            Assert.Equal(v.GetValue("settingName")!.ToString(), "settingNameValue");
            Assert.Equal(v.GetValue("testKey")!.ToString(), "testValue");

        }

        [Fact]
        public void Test_GetSettingNameFromContextActivityValue_NullContextActivityValue_ReturnsNull()
        {
            var context = MockTurnContext();
            context.Activity.Value = null;

            // act
            var s = BotAuthenticationBase<TurnState>.GetSettingNameFromContextActivityValue(context);

            // assert
            Assert.Null(s);
        }

        [Fact]
        public void Test_GetSettingNameFromContextActivityValue_MissingSettingName_ReturnsNull()
        {
            var context = MockTurnContext();
            context.Activity.Value = new JObject();
            ((JObject)context.Activity.Value).Add("INCORRECT settingName", "settingNameValue");

            // act
            var s = BotAuthenticationBase<TurnState>.GetSettingNameFromContextActivityValue(context);

            // assert
            Assert.Null(s);
        }

        [Fact]
        public void Test_GetSettingNameFromContextActivityValue_ReturnsSettingName()
        {
            var context = MockTurnContext();
            context.Activity.Value = new JObject();
            ((JObject)context.Activity.Value).Add("settingName", "settingNameValue");

            // act
            var s = BotAuthenticationBase<TurnState>.GetSettingNameFromContextActivityValue(context);

            // assert
            Assert.NotNull(s);
            Assert.Equal(s, "settingNameValue");
        }

        private static TurnContext MockTurnContext(string type = ActivityTypes.Message)
        {
            return new TurnContext(new SimpleAdapter(), new Activity()
            {
                Type = type,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
                Text = "test text"
            });
        }
    }
}
