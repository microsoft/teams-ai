using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Application.Authentication.Bot;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.Bot
{
    internal class MockedBotAuthentication<TState> : BotAuthenticationBase<TState>
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

        public override Task<DialogTurnResult> ContinueDialog(ITurnContext context, TState state, string dialogStateProperty)
        {
            if (_throwExceptionWhenContinue)
            {
                throw new Exception("mocked error");
            }
            return Task.FromResult(_continueDialogResult);
        }

        public override Task<DialogTurnResult> RunDialog(ITurnContext context, TState state, string dialogStateProperty)
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
            var response = await botAuth.AuthenticateAsync(context, state);

            // assert
            var stateKey = "__fromId:test:Bot:AuthState__";
            var authState = state.Conversation[stateKey] as Dictionary<string, string>;
            Assert.Equal(SignInStatus.Pending, response.Status);
            Assert.NotNull(authState);
            Assert.True(authState.ContainsKey("message"));
            Assert.Equal("test text", authState["message"]);
        }

        [Fact]
        public async void Test_Authenticate_Complete()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", runDialogResult: new List<DialogTurnResult>() { new DialogTurnResult(DialogTurnStatus.Complete, new TokenResponse(token: "test token")) });
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);

            // act
            var response = await botAuth.AuthenticateAsync(context, state);

            // assert
            Assert.Equal(SignInStatus.Complete, response.Status);
            Assert.Equal("test token", response.Token);
        }

        [Fact]
        public async void Test_Authenticate_CompleteWithoutToken()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var botAuth = new MockedBotAuthentication<TurnState>(app, "test", runDialogResult: new List<DialogTurnResult>() { new DialogTurnResult(DialogTurnStatus.Complete) });
            var context = MockTurnContext();
            var state = await TurnStateConfig.GetTurnStateWithConversationStateAsync(context);

            // act
            var response = await botAuth.AuthenticateAsync(context, state);

            // assert
            Assert.Equal(SignInStatus.Pending, response.Status);
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
            botAuth.OnUserSignInFailure((context, state, exception) => { throw new Exception("sign in failure handler should not be called"); });

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
            TeamsAIAuthException? authException = null;
            botAuth.OnUserSignInSuccess((context, state) => { throw new Exception("sign in success handler should not be called"); });
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
            TeamsAIAuthException? authException = null;
            botAuth.OnUserSignInSuccess((context, state) => { throw new Exception("sign in success handler should not be called"); });
            botAuth.OnUserSignInFailure((context, state, exception) => { authException = exception; return Task.CompletedTask; });

            // act
            await botAuth.HandleSignInActivity(context, state, new CancellationToken());

            // assert
            Assert.NotNull(authException);
            Assert.Equal("Unexpected error encountered while signing in: mocked error.\nIncoming activity details: type: message, name: ", authException.Message);
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
