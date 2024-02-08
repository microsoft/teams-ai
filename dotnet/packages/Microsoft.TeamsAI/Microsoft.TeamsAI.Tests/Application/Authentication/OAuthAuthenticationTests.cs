using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class OAuthAuthenticationTests
    {
        [Fact]
        public async void Test_IsUserSignedIn_ReturnsTokenString()
        {
            // Arrange
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var oauthSettings = new OAuthSettings() { ConnectionName = "connectionName" };
            var app = new TestApplication(new()
            {
                Adapter = new SimpleAdapter()
            });
            var tokenResponse = new TokenResponse()
            {
                Token = "validToken",
                Expiration = "validExpiration",
                ConnectionName = "connectionName",
            };
            var auth = new TestOAuthAuthentication(tokenResponse, app, "name", oauthSettings, null);


            // Act
            var result = await auth.IsUserSignedInAsync(turnContext);

            // Assert
            Assert.NotNull(result);
            Assert.True(result == "validToken");
        }

        [Fact]
        public async void Test_IsUserSignedIn_ReturnsNull()
        {
            // Arrange
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var oauthSettings = new OAuthSettings() { ConnectionName = "connectionName" };
            var app = new TestApplication(new()
            {
                Adapter = new SimpleAdapter()
            });
            var tokenResponse = new TokenResponse()
            {
                Token = "", // Empty token
                Expiration = "",
                ConnectionName = "connectionName",
            };
            var auth = new TestOAuthAuthentication(tokenResponse, app, "name", oauthSettings, null);


            // Act
            var result = await auth.IsUserSignedInAsync(turnContext);

            // Assert
            Assert.Null(result);
        }
    }

    public class TestOAuthAuthentication : OAuthAuthentication<TurnState>
    {
        private TokenResponse _tokenResponse;

        internal TestOAuthAuthentication(TokenResponse tokenResponse, Application<TurnState> app, string name, OAuthSettings settings, IStorage? storage) : base(settings, new OAuthMessageExtensionsAuthentication(settings), new OAuthBotAuthentication<TurnState>(app, settings, name, storage))
        {
            _tokenResponse = tokenResponse;
        }

        internal TestOAuthAuthentication(TokenResponse tokenResponse, OAuthSettings settings, OAuthMessageExtensionsAuthentication messageExtensionAuth, OAuthBotAuthentication<TurnState> botAuthentication) : base(settings, messageExtensionAuth, botAuthentication)
        {
            _tokenResponse = tokenResponse;
        }

        protected override Task<TokenResponse> GetUserToken(ITurnContext context, string connectionName, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(_tokenResponse);
        }
    }
}
