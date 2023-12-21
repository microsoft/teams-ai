using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Identity.Client;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.Bot
{
    public class TeamsSsoBotAuthenticationTests
    {
        internal class MockTeamsSsoBotAuthentication<TState> : TeamsSsoBotAuthentication<TState>
            where TState : TurnState, new()
        {
            private IDialogSet? _dialogSet;

            public MockTeamsSsoBotAuthentication(Application<TState> app, string name, TeamsSsoSettings settings, IDialogSet? mockDialogSet = null, TeamsSsoPrompt? mockPrompt = null, IStorage? storage = null) : base(app, name, settings, storage)
            {
                _dialogSet = mockDialogSet;
                if (mockPrompt != null)
                {
                    _prompt = mockPrompt;
                }
            }

            protected override IDialogSet CreateDialogSet(IStatePropertyAccessor<DialogState> dialogState)
            {
                if (_dialogSet != null)
                {
                    return _dialogSet;
                }
                return base.CreateDialogSet(dialogState);
            }

            public async Task<bool> TokenExchangeRouteSelectorPublic(ITurnContext context, CancellationToken cancellationToken)
            {
                return await base.TokenExchangeRouteSelector(context, cancellationToken);
            }
        }

        [Fact]
        public async void Test_RunDialog_BeginNew()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            var mockDialogContext = new Mock<IDialogContext>();
            mockDialogContext
                .Setup(mock => mock.ContinueDialogAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Empty));
            mockDialogContext
                .Setup(mock => mock.BeginDialogAsync(It.IsAny<string>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Waiting));

            var mockDialogSet = new Mock<IDialogSet>();
            mockDialogSet
                .Setup(mock => mock.CreateContextAsync(It.IsAny<ITurnContext>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockDialogContext.Object);

            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "test", settings, mockDialogSet.Object);

            // act
            var result = await botAuthentication.RunDialog(turnContext, turnState, "dialogStatePropertyName");

            // assert
            Assert.Equal(DialogTurnStatus.Waiting, result.Status);
        }

        [Fact]
        public async void Test_RunDialog_ContinueExisting()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            var mockDialogContext = new Mock<IDialogContext>();
            mockDialogContext
                .Setup(mock => mock.ContinueDialogAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Complete));

            var mockDialogSet = new Mock<IDialogSet>();
            mockDialogSet
                .Setup(mock => mock.CreateContextAsync(It.IsAny<ITurnContext>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockDialogContext.Object);

            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "test", settings, mockDialogSet.Object);

            // act
            var result = await botAuthentication.RunDialog(turnContext, turnState, "dialogStatePropertyName");

            // assert
            Assert.Equal(DialogTurnStatus.Complete, result.Status);
        }

        [Fact]
        public async void Test_ContinueDialog()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            var mockDialogContext = new Mock<IDialogContext>();
            mockDialogContext
                .Setup(mock => mock.ContinueDialogAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Empty));

            var mockDialogSet = new Mock<IDialogSet>();
            mockDialogSet
                .Setup(mock => mock.CreateContextAsync(It.IsAny<ITurnContext>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(mockDialogContext.Object);

            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "test", settings, mockDialogSet.Object);

            // act
            var result = await botAuthentication.ContinueDialog(turnContext, turnState, "dialogStatePropertyName");

            // assert
            Assert.Equal(DialogTurnStatus.Empty, result.Status);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_NameMatched()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var turnContext = MockTurnContext(ActivityTypes.Invoke, SignInConstants.TokenExchangeOperationName);
            JObject activityValue = new();
            activityValue["id"] = $"{Guid.NewGuid()}-test";
            turnContext.Activity.Value = activityValue;

            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "test", settings);

            // act
            var result = await botAuthentication.TokenExchangeRouteSelectorPublic(turnContext, CancellationToken.None);

            // assert
            Assert.True(result);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_NameNotMatch()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var turnContext = MockTurnContext(ActivityTypes.Invoke, SignInConstants.TokenExchangeOperationName);
            JObject activityValue = new();
            activityValue["id"] = $"{Guid.NewGuid()}-AnotherTokenName";
            turnContext.Activity.Value = activityValue;

            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "test", settings);

            // act
            var result = await botAuthentication.TokenExchangeRouteSelectorPublic(turnContext, CancellationToken.None);

            // assert
            Assert.False(result);
        }

        [Fact]
        public async void Test_Dedupe()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var mockedPrompt = new Mock<TeamsSsoPrompt>("TeamsSsoPrompt", "TokenName", settings);
            mockedPrompt
                .Setup(mock => mock.BeginDialogAsync(It.IsAny<DialogContext>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Waiting));
            mockedPrompt
                .Setup(mock => mock.ContinueDialogAsync(It.IsAny<DialogContext>(), It.IsAny<CancellationToken>()))
                .Returns(async (DialogContext dc, CancellationToken cancellationToken) =>
                {
                    return await dc.EndDialogAsync(new TokenResponse(token: "test token"));
                });
            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "TokenName", settings, mockPrompt: mockedPrompt.Object);

            // act
            var messageContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(messageContext);
            var messageResult = await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty");
            var tokenExchangeContext = MockTokenExchangeContext();
            var tokenExchangeResult = await botAuthentication.ContinueDialog(tokenExchangeContext, turnState, "dialogStateProperty");

            // assert
            Assert.NotNull(tokenExchangeResult.Result);
            Assert.Equal("test token", ((TokenResponse)tokenExchangeResult.Result).Token);

            // act - simulate processing duplicate request
            await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty");
            tokenExchangeResult = await botAuthentication.ContinueDialog(tokenExchangeContext, turnState, "dialogStateProperty");

            // assert
            Assert.Equal(DialogTurnStatus.Waiting, tokenExchangeResult.Status);
        }

        [Fact]
        public async void Test_RunDialog()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var mockedPrompt = new Mock<TeamsSsoPrompt>("TeamsSsoPrompt", "TokenName", settings);
            mockedPrompt
                .Setup(mock => mock.BeginDialogAsync(It.IsAny<DialogContext>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Waiting));
            mockedPrompt
                .Setup(mock => mock.ContinueDialogAsync(It.IsAny<DialogContext>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(Dialog.EndOfTurn);
            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "TokenName", settings, mockPrompt: mockedPrompt.Object);
            var messageContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(messageContext);

            // act
            var result = await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty");

            // assert
            Assert.Equal(DialogTurnStatus.Waiting, result.Status);
        }

        private static TurnContext MockTurnContext(string type = ActivityTypes.Message, string? name = null)
        {
            return new TurnContext(new SimpleAdapter(), new Activity()
            {
                Type = type,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
                Name = name
            });
        }

        private static TurnContext MockTokenExchangeContext(string settingName = "test")
        {
            JObject activityValue = new();
            activityValue["id"] = $"{Guid.NewGuid()}-{settingName}";

            return new TurnContext(new SimpleAdapter(), new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = SignInConstants.TokenExchangeOperationName,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
                Value = activityValue
            });
        }
    }
}
