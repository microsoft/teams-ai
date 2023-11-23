using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class AuthenticationManagerTests
    {
        [Fact]
        public async void Test_SignIn_DefaultHandler()
        {
            // arrange
            var graphToken = "graph token";
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication(mockedToken: graphToken) },
                { "sharepoint", new MockedAuthentication() }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            // act
            var response = await authManager.SignUserIn(turnContext, turnState);

            // assert
            Assert.Equal(SignInStatus.Complete, response.Status);
            Assert.Equal(graphToken, response.Token);
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("graph"));
            Assert.Equal(graphToken, turnState.Temp.AuthTokens["graph"]);
        }

        [Fact]
        public async void Test_SignIn_SpecificHandler()
        {
            // arrange
            var sharepointToken = "sharepoint token";
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication() },
                { "sharepoint", new MockedAuthentication(mockedToken: sharepointToken) }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            // act
            var response = await authManager.SignUserIn(turnContext, turnState, "sharepoint");

            // assert
            Assert.Equal(SignInStatus.Complete, response.Status);
            Assert.Equal(sharepointToken, response.Token);
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("sharepoint"));
            Assert.Equal(sharepointToken, turnState.Temp.AuthTokens["sharepoint"]);
        }

        [Fact]
        public async void Test_SignIn_Pending()
        {
            // arrange
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication(SignInStatus.Pending) },
                { "sharepoint", new MockedAuthentication() }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);

            // act
            var response = await authManager.SignUserIn(turnContext, turnState);

            // assert
            Assert.Equal(SignInStatus.Pending, response.Status);
            Assert.Null(response.Token);
        }

        [Fact]
        public async void Test_SignOut_DefaultHandler()
        {
            // arrange
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication() },
                { "sharepoint", new MockedAuthentication() }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.Temp.AuthTokens = new Dictionary<string, string>()
            {
                {"graph", "graph token" },
                {"sharepoint", "sharepoint token" }
            };

            // act
            await authManager.SignOutUser(turnContext, turnState);

            // assert
            Assert.False(turnState.Temp.AuthTokens.ContainsKey("graph"));
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("sharepoint"));
        }

        [Fact]
        public async void Test_SignOut_SpecificHandler()
        {
            // arrange
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication() },
                { "sharepoint", new MockedAuthentication() }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            turnState.Temp.AuthTokens = new Dictionary<string, string>()
            {
                {"graph", "graph token" },
                {"sharepoint", "sharepoint token" }
            };

            // act
            await authManager.SignOutUser(turnContext, turnState, "sharepoint");

            // assert
            Assert.False(turnState.Temp.AuthTokens.ContainsKey("sharepoint"));
            Assert.True(turnState.Temp.AuthTokens.ContainsKey("graph"));
        }

        [Fact]
        public async void Test_IsValidActivity_DefaultHandler()
        {
            // arrange
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication(validActivity: true) },
                { "sharepoint", new MockedAuthentication(validActivity: false) }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();

            // act
            var validActivity = await authManager.IsValidActivity(turnContext);

            // assert
            Assert.True(validActivity);
        }

        [Fact]
        public async void Test_IsValidActivity_SpecificHandler()
        {
            // arrange
            var authentications = new Dictionary<string, IAuthentication>()
            {
                { "graph", new MockedAuthentication(validActivity: false) },
                { "sharepoint", new MockedAuthentication(validActivity: true) }
            };
            var options = new AuthenticationOptions(authentications);
            var authManager = new AuthenticationManager<TurnState>(options);
            var turnContext = MockTurnContext();

            // act
            var validActivity = await authManager.IsValidActivity(turnContext, "sharepoint");

            // assert
            Assert.True(validActivity);
        }

        private TurnContext MockTurnContext()
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
