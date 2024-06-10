using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Identity.Client;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Tests.Application.Authentication
{
    public class TeamsSsoAuthenticationTests
    {
        private const string ClientId = "ClientId";
        private const string TenantId = "TenantId";
        private const string UserReadScope = "User.Read";
        private const string AuthStartPage = "https://localhost/auth-start.html";
        private const string AccessToken = "test token";

        private sealed class TeamsSsoAuthenticationMock<TState> : TeamsSsoAuthentication<TState>
            where TState : TurnState, new()
        {
            public TeamsSsoAuthenticationMock(Application<TState> app, string name, TeamsSsoSettings settings, IConfidentialClientApplicationAdapter msalAdapterMock) : base(app, name, settings, null)
            {
                _msalAdapter = msalAdapterMock;
            }

            public Func<ITurnContext, TState, Task>? GetSignInSuccessHandler()
            {
                return _botAuth?._userSignInSuccessHandler;
            }

            public Func<ITurnContext, TState, AuthException, Task>? GetSignInFailureHandler()
            {
                return _botAuth?._userSignInFailureHandler;
            }
        }

        [Fact]
        public async Task SignInUserAsync_GetTokenFromCache()
        {
            // Arrange
            var authenticationResult = MockAuthenticationResult();
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.AcquireTokenInLongRunningProcess(It.IsAny<IEnumerable<string>>(), It.IsAny<string>())).ReturnsAsync(authenticationResult);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var teamsSsoAuthentication = CreateTestClass(msalAdapterMock.Object);

            // Act
            var result = await teamsSsoAuthentication.SignInUserAsync(turnContext, turnState);

            // Assert
            Assert.Equal(authenticationResult.AccessToken, result);
        }

        [Fact]
        public async Task SignOutUserAsync()
        {
            // Arrange
            var authenticationResult = MockAuthenticationResult();
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.StopLongRunningProcessInWebApiAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var teamsSsoAuthentication = CreateTestClass(msalAdapterMock.Object);

            // Act
            await teamsSsoAuthentication.SignOutUserAsync(turnContext, turnState);

            // Assert
            msalAdapterMock.Verify(m => m.StopLongRunningProcessInWebApiAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public void OnUserSignInSuccess()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var teamsSsoAuthentication = CreateTestClass(msalAdapterMock.Object);

            // Act
            teamsSsoAuthentication.OnUserSignInSuccess((turnContext, turnState) => { return Task.CompletedTask; });

            // Assert
            Assert.NotNull(teamsSsoAuthentication.GetSignInSuccessHandler());
        }

        [Fact]
        public void OnUserSignInFailure()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var teamsSsoAuthentication = CreateTestClass(msalAdapterMock.Object);

            // Act
            teamsSsoAuthentication.OnUserSignInFailure((turnContext, turnState, exception) => { return Task.CompletedTask; });

            // Assert
            Assert.NotNull(teamsSsoAuthentication.GetSignInFailureHandler());
        }

        [Fact]
        public async Task IsUserSignedInAsync_UserSignedIn()
        {
            // Arrange
            var authenticationResult = MockAuthenticationResult();
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.AcquireTokenInLongRunningProcess(It.IsAny<IEnumerable<string>>(), It.IsAny<string>())).ReturnsAsync(authenticationResult);
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var teamsSsoAuthentication = CreateTestClass(msalAdapterMock.Object);

            // Act
            var result = await teamsSsoAuthentication.IsUserSignedInAsync(turnContext);

            // Assert
            Assert.Equal(authenticationResult.AccessToken, result);
        }

        [Fact]
        public async Task IsUserSignedInAsync_UserNotSignedIn()
        {
            // Arrange
            var authenticationResult = MockAuthenticationResult();
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.AcquireTokenInLongRunningProcess(It.IsAny<IEnumerable<string>>(), It.IsAny<string>())).Throws(new MsalClientException("error code", "error message"));
            var turnContext = MockTurnContext();
            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var teamsSsoAuthentication = CreateTestClass(msalAdapterMock.Object);

            // Act
            var result = await teamsSsoAuthentication.IsUserSignedInAsync(turnContext);

            // Assert
            Assert.Null(result);
        }

        private static AuthenticationResult MockAuthenticationResult(string token = AccessToken, string scope = UserReadScope)
        {
            return new AuthenticationResult(token, false, "", DateTimeOffset.Now, DateTimeOffset.Now, "", null, "", new string[] { scope }, Guid.NewGuid());
        }

        private static Mock<IConfidentialClientApplicationAdapter> MockMsalAdapter()
        {
            var msalAdapterMock = new Mock<IConfidentialClientApplicationAdapter>();
            msalAdapterMock.Setup(m => m.AppConfig).Returns(new AppConfig(ClientId, TenantId));
            return msalAdapterMock;
        }

        private static TeamsSsoAuthenticationMock<TurnState> CreateTestClass(IConfidentialClientApplicationAdapter msalAdapterMock)
        {
            var app = new Application<TurnState>(new ApplicationOptions<TurnState>());
            var settings = new TeamsSsoSettings(new string[] { UserReadScope }, AuthStartPage, It.IsAny<IConfidentialClientApplication>());
            return new TeamsSsoAuthenticationMock<TurnState>(app, "test", settings, msalAdapterMock);
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
