using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class AuthenticationManagerTests
    {
        [Fact]
        public async void Test_SignIn_DefaultSetting()
        {
            // arrange
            var graphToken = "graph token";
            var app = new TestApplication(new TestApplicationOptions());
            var options = new AuthenticationOptions<TurnState>();
            options._authenticationSettings = new Dictionary<string, object>()
            {
                { "graph", new TestAuthenticationSettings(graphToken) },
                { "sharepoint", new TestAuthenticationSettings() }
            };
            var authManager = new TestAuthenticationManager(options, app);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            // act
            var response = await authManager.SignUserInAsync(turnContext, turnState);

            // assert
            Assert.Equal(SignInStatus.Complete, response.Status);
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("graph"));
            Assert.Equal(graphToken, turnState.Temp.AuthTokens["graph"]);
        }

        [Fact]
        public async void Test_SignIn_SpecificSetting()
        {
            // arrange
            var sharepointToken = "graph token";
            var app = new TestApplication(new TestApplicationOptions());
            var options = new AuthenticationOptions<TurnState>();
            options._authenticationSettings = new Dictionary<string, object>()
            {
                { "graph", new TestAuthenticationSettings() },
                { "sharepoint", new TestAuthenticationSettings(sharepointToken) }
            };
            var authManager = new TestAuthenticationManager(options, app);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            // act
            var response = await authManager.SignUserInAsync(turnContext, turnState, "sharepoint");

            // assert
            Assert.Equal(SignInStatus.Complete, response.Status);
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("sharepoint"));
            Assert.Equal(sharepointToken, turnState.Temp.AuthTokens["sharepoint"]);
        }

        [Fact]
        public async void Test_SignIn_Pending()
        {
            var app = new TestApplication(new TestApplicationOptions());
            var options = new AuthenticationOptions<TurnState>();
            options._authenticationSettings = new Dictionary<string, object>()
            {
                { "graph", new TestAuthenticationSettings() },
                { "sharepoint", new TestAuthenticationSettings() }
            };
            var authManager = new TestAuthenticationManager(options, app);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            // act
            var response = await authManager.SignUserInAsync(turnContext, turnState);

            // assert
            Assert.Equal(SignInStatus.Pending, response.Status);
        }

        [Fact]
        public async void Test_SignOut_DefaultHandler()
        {
            // arrange
            var app = new TestApplication(new TestApplicationOptions());
            var options = new AuthenticationOptions<TurnState>();
            options._authenticationSettings = new Dictionary<string, object>()
            {
                { "graph", new TestAuthenticationSettings() },
                { "sharepoint", new TestAuthenticationSettings() }
            };
            var authManager = new TestAuthenticationManager(options, app);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.Temp.AuthTokens = new Dictionary<string, string>()
            {
                {"graph", "graph token" },
                {"sharepoint", "sharepoint token" }
            };

            // act
            await authManager.SignOutUserAsync(turnContext, turnState);

            // assert
            Assert.False(turnState.Temp.AuthTokens.ContainsKey("graph"));
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("sharepoint"));
        }

        [Fact]
        public async void Test_SignOut_SpecificHandler()
        {
            // arrange
            var graphToken = "graph token";
            var app = new TestApplication(new TestApplicationOptions());
            var options = new AuthenticationOptions<TurnState>();
            options._authenticationSettings = new Dictionary<string, object>()
            {
                { "graph", new TestAuthenticationSettings() },
                { "sharepoint", new TestAuthenticationSettings() }
            };
            var authManager = new TestAuthenticationManager(options, app);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.Temp.AuthTokens = new Dictionary<string, string>()
            {
                {"graph", "graph token" },
                {"sharepoint", "sharepoint token" }
            };

            // act
            await authManager.SignOutUserAsync(turnContext, turnState, "sharepoint");

            // assert
            Assert.False(turnState.Temp.AuthTokens.ContainsKey("sharepoint"));
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("graph"));
        }

        private static TurnContext MockTurnContext()
        {
            return new TurnContext(new SimpleAdapter(), new Activity()
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
        }
    }
}
