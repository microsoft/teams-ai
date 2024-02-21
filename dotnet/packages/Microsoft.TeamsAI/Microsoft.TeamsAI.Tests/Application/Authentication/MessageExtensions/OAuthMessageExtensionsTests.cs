using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Tests.TestUtils;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.MessageExtensions
{
    public class OAuthMessageExtensionsTests
    {
        [Fact]
        public void Test_isSsoSignIn_False()
        {
            // Arrange
            var turnContext = new TurnContext(new NotImplementedAdapter(), new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
            });
            var oauthSettings = new OAuthSettings() { EnableSso = false };
            var messageExtensionsAuth = new OAuthMessageExtensionsAuthentication(oauthSettings);

            // Act
            var result = messageExtensionsAuth.IsSsoSignIn(turnContext);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public void Test_isSsoSignIn_True()
        {
            // Arrange
            var turnContext = new TurnContext(new NotImplementedAdapter(), new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
            });
            var oauthSettings = new OAuthSettings() { EnableSso = true };
            var messageExtensionsAuth = new OAuthMessageExtensionsAuthentication(oauthSettings);

            // Act
            var result = messageExtensionsAuth.IsSsoSignIn(turnContext);

            // Assert
            Assert.True(result);
        }
    }
}
