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
            public MockTeamsSsoBotAuthentication(Application<TState> app, string name, TeamsSsoSettings settings, TeamsSsoPrompt? mockPrompt = null) : base(app, name, settings, null)
            {
                if (mockPrompt != null)
                {
                    _prompt = mockPrompt;
                }
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
            var mockedPrompt = CreateTeamsSsoPromptMock(settings);
            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "TokenName", settings, mockedPrompt.Object);
            var messageContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(messageContext);

            // act
            var result = await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty");

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
            var mockedPrompt = CreateTeamsSsoPromptMock(settings);
            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "TokenName", settings, mockedPrompt.Object);
            var messageContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(messageContext);
            await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty"); // Begin new dialog first

            // act
            var tokenExchangeContext = MockTokenExchangeContext();
            var result = await botAuthentication.RunDialog(tokenExchangeContext, turnState, "dialogStateProperty");

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
            var mockedPrompt = CreateTeamsSsoPromptMock(settings);
            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "TokenName", settings, mockedPrompt.Object);
            var messageContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(messageContext);
            await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty"); // Begin new dialog first

            // act
            var tokenExchangeContext = MockTokenExchangeContext();
            var result = await botAuthentication.ContinueDialog(tokenExchangeContext, turnState, "dialogStateProperty");

            // assert
            Assert.Equal(DialogTurnStatus.Complete, result.Status);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_NameMatched()
        {
            // arrange
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var msal = ConfidentialClientApplicationBuilder.Create("clientId").WithClientSecret("clientSecret").Build();
            var settings = new TeamsSsoSettings(new string[] { "User.Read" }, "https://localhost/auth-start.html", msal);
            var turnContext = MockTokenExchangeContext("test");

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
            var turnContext = MockTokenExchangeContext("AnotherTokenName");

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
            var mockedPrompt = CreateTeamsSsoPromptMock(settings);
            var botAuthentication = new MockTeamsSsoBotAuthentication<TurnState>(app, "TokenName", settings, mockedPrompt.Object);

            // act
            var messageContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(messageContext);
            await botAuthentication.RunDialog(messageContext, turnState, "dialogStateProperty");
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

        private static Mock<TeamsSsoPrompt> CreateTeamsSsoPromptMock(TeamsSsoSettings settings)
        {
            var mockedPrompt = new Mock<TeamsSsoPrompt>("TeamsSsoPrompt", "TokenName", settings);
            mockedPrompt
                .Setup(mock => mock.BeginDialogAsync(It.IsAny<DialogContext>(), It.IsAny<object>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new DialogTurnResult(DialogTurnStatus.Waiting));
            mockedPrompt
                .Setup(mock => mock.ContinueDialogAsync(It.IsAny<DialogContext>(), It.IsAny<CancellationToken>()))
                .Returns(async (DialogContext dc, CancellationToken cancellationToken) => await dc.EndDialogAsync(new TokenResponse(token: "test token")));
            return mockedPrompt;
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
            JObject activityValue = new()
            {
                ["id"] = $"{Guid.NewGuid()}-{settingName}",
                ["settingName"] = settingName
            };

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
