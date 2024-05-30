using Microsoft.Bot.Builder;
using Microsoft.Identity.Client;
using Moq;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Tests.TestUtils;
using Newtonsoft.Json.Linq;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.MessageExtensions
{
    public class TeamsSsoMessageExtensionsAuthenticationTests
    {
        private const string ClientId = "ClientId";
        private const string TenantId = "TenantId";
        private const string UserReadScope = "User.Read";
        private const string AuthStartPage = "https://localhost/auth-start.html";
        private const string AccessToken = "test token";

        private sealed class TeamsSsoMessageExtensionsAuthenticationMock : TeamsSsoMessageExtensionsAuthentication
        {
            public TeamsSsoMessageExtensionsAuthenticationMock(TeamsSsoSettings settings, IConfidentialClientApplicationAdapter msalAdapterMock) : base(settings)
            {
                _msalAdapter = msalAdapterMock;
            }
        }

        [Fact]
        public async Task GetSignInLink()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            var turnContext = MockTurnContext();

            // Act
            var signInLink = await messageExtensionAuth.GetSignInLink(turnContext);

            // Assert
            Assert.Equal($"{AuthStartPage}?scope={UserReadScope}&clientId={ClientId}&tenantId={TenantId}", signInLink);
        }

        [Fact]
        public async Task HandleUserSignIn()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            var turnContext = MockTurnContext();

            // Act
            var tokenResponse = await messageExtensionAuth.HandleUserSignIn(turnContext, "123456");

            // Assert
            Assert.Null(tokenResponse.Token);
            Assert.Null(tokenResponse.Expiration);
        }

        [Fact]
        public void IsValidActivity_Valid()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            var turnContext = MockTurnContext();

            // Act
            var isValidActivity = messageExtensionAuth.IsValidActivity(turnContext);

            // Assert
            Assert.True(isValidActivity);
        }

        [Fact]
        public void IsValidActivity_InValid()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);

            // Act and Assert
            Assert.False(messageExtensionAuth.IsValidActivity(MockTurnContext(MessageExtensionsInvokeNames.QUERY_LINK_INVOKE_NAME)));
            Assert.False(messageExtensionAuth.IsValidActivity(MockTurnContext(MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME)));
            Assert.False(messageExtensionAuth.IsValidActivity(MockTurnContext(MessageExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE_NAME)));
        }

        [Fact]
        public async Task HandleSsoTokenExchange_NoTokenInRequest()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var authenticationResult = MockAuthenticationResult();
            msalAdapterMock.Setup(m => m.InitiateLongRunningProcessInWebApi(It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), ref It.Ref<string>.IsAny)).ReturnsAsync(authenticationResult);
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            var turnContext = MockTurnContext();

            // Act
            var result = await messageExtensionAuth.HandleSsoTokenExchange(turnContext);

            // Assert
            Assert.Null(result.Token);
            Assert.Null(result.Expiration);
        }

        [Fact]
        public async Task HandleSsoTokenExchange_TokenExchangeSuccess()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var authenticationResult = MockAuthenticationResult();
            msalAdapterMock.Setup(m => m.InitiateLongRunningProcessInWebApi(It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), ref It.Ref<string>.IsAny)).ReturnsAsync(authenticationResult);
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            JObject activityValue = new()
            {
                ["authentication"] = new JObject()
            };
            activityValue["authentication"]!["token"] = "sso token";
            var turnContext = MockTurnContext(activityValue: activityValue);

            // Act
            var result = await messageExtensionAuth.HandleSsoTokenExchange(turnContext);

            // Assert
            Assert.Equal(authenticationResult.AccessToken, result.Token);
            Assert.Equal(authenticationResult.ExpiresOn.ToString("O"), result.Expiration);
        }

        [Fact]
        public async Task HandleSsoTokenExchange_TokenExchangeFail()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.InitiateLongRunningProcessInWebApi(It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), ref It.Ref<string>.IsAny)).Throws(new MsalUiRequiredException("error code", "error message"));
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            JObject activityValue = new()
            {
                ["authentication"] = new JObject()
            };
            activityValue["authentication"]!["token"] = "sso token";
            var turnContext = MockTurnContext(activityValue: activityValue);

            // Act
            var result = await messageExtensionAuth.HandleSsoTokenExchange(turnContext);

            // Assert
            Assert.Null(result.Token);
            Assert.Null(result.Expiration);
        }

        [Fact]
        public async Task HandleSsoTokenExchange_UnexpectedException()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.InitiateLongRunningProcessInWebApi(It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), ref It.Ref<string>.IsAny)).Throws(new MsalServiceException("error code", "error message"));
            var messageExtensionAuth = CreateTestClass(msalAdapterMock.Object);
            JObject activityValue = new()
            {
                ["authentication"] = new JObject()
            };
            activityValue["authentication"]!["token"] = "sso token";
            var turnContext = MockTurnContext(activityValue: activityValue);

            // Act and Assert
            await Assert.ThrowsAsync<AuthException>(async () => await messageExtensionAuth.HandleSsoTokenExchange(turnContext));
        }

        private static Mock<IConfidentialClientApplicationAdapter> MockMsalAdapter()
        {
            var msalAdapterMock = new Mock<IConfidentialClientApplicationAdapter>();
            msalAdapterMock.Setup(m => m.AppConfig).Returns(new AppConfig(ClientId, TenantId));
            return msalAdapterMock;
        }

        private static TeamsSsoMessageExtensionsAuthentication CreateTestClass(IConfidentialClientApplicationAdapter msalAdapterMock)
        {
            var settings = new TeamsSsoSettings(new string[] { UserReadScope }, AuthStartPage, It.IsAny<IConfidentialClientApplication>());
            return new TeamsSsoMessageExtensionsAuthenticationMock(settings, msalAdapterMock);
        }

        private static AuthenticationResult MockAuthenticationResult(string token = AccessToken, string scope = UserReadScope)
        {
            return new AuthenticationResult(token, false, "", DateTimeOffset.Now, DateTimeOffset.Now, "", null, "", new string[] { scope }, Guid.NewGuid());
        }

        private static TurnContext MockTurnContext(string? name = null, JObject? activityValue = null)
        {
            return new TurnContext(new SimpleAdapter(), new Activity()
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId", TenantId = "tenantId" },
                From = new() { Id = "fromId", AadObjectId = "aadObjectId" },
                ChannelId = "channelId",
                Name = name ?? MessageExtensionsInvokeNames.QUERY_INVOKE_NAME,
                Value = activityValue ?? new JObject()
            });
        }
    }
}
