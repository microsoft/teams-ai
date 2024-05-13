using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.Bot
{
    internal class TestOAuthBotAuthentication : OAuthBotAuthentication<TurnState>
    {
        public TestOAuthBotAuthentication(Application<TurnState> app, OAuthSettings oauthSettings, string settingName, IStorage? storage = null) : base(app, oauthSettings, settingName, storage)
        {
        }

        protected override Task<SignInResource> GetSignInResourceAsync(ITurnContext context, string connectionName, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(new SignInResource()
            {
                SignInLink = "signInLink",
                TokenExchangeResource = new TokenExchangeResource()
                {
                    Id = "id",
                    Uri = "uri"
                },
                TokenPostResource = new TokenPostResource()
                {
                    SasUrl = "sasUrl",
                }
            });
        }
    }

    public class OAuthBotAuthenticationTests
    {
        private const string SETTING_NAME = "settingName";

        [Fact]
        public async void Test_CreateOAuthCard_WithSSOEnabled()
        {
            // Arrange
            IActivity sentActivity;
            var testAdapter = new SimpleAdapter((activity) => sentActivity = activity);
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new TestApplication(new() { Adapter = testAdapter });
            var authSettings = new OAuthSettings() {
                ConnectionName = "connectionName",
                Title = "title",
                Text = "text",
                EnableSso = true
            };

            var botAuth = new TestOAuthBotAuthentication(app, authSettings, "connectionName");

            // Act
            var result = await botAuth.CreateOAuthCard(turnContext);

            // Assert
            var card = result.Content as OAuthCard;
            Assert.NotNull(card);
            Assert.Equal(card.Text, authSettings.Text);
            Assert.Equal(card.ConnectionName, authSettings.ConnectionName);
            Assert.Equal(card.Buttons[0].Title, authSettings.Title);
            Assert.Equal(card.Buttons[0].Text, authSettings.Text);
            Assert.Equal(card.Buttons[0].Type, "signin");
            Assert.Equal(card.Buttons[0].Value, "signInLink");
            Assert.NotNull(card.TokenExchangeResource);
            Assert.Equal(card.TokenExchangeResource.Id, "id");
            Assert.Equal(card.TokenExchangeResource.Uri, "uri");
            Assert.NotNull(card.TokenPostResource);
            Assert.Equal(card.TokenPostResource.SasUrl, "sasUrl");
        }

        [Fact]
        public async void Test_CreateOAuthCard_WithoutSSO()
        {
            // Arrange
            IActivity sentActivity;
            var testAdapter = new SimpleAdapter((activity) => sentActivity = activity);
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            var turnState = await TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new TestApplication(new() { Adapter = testAdapter });
            var authSettings = new OAuthSettings()
            {
                ConnectionName = "connectionName",
                Title = "title",
                Text = "text",
                EnableSso = false
            };

            var botAuth = new TestOAuthBotAuthentication(app, authSettings, "connectionName");

            // Act
            var result = await botAuth.CreateOAuthCard(turnContext);

            // Assert
            var card = result.Content as OAuthCard;
            Assert.NotNull(card);
            Assert.Equal(card.Text, authSettings.Text);
            Assert.Equal(card.ConnectionName, authSettings.ConnectionName);
            Assert.Equal(card.Buttons[0].Title, authSettings.Title);
            Assert.Equal(card.Buttons[0].Text, authSettings.Text);
            Assert.Equal(card.Buttons[0].Type, "signin");
            Assert.Equal(card.Buttons[0].Value, "signInLink");
            Assert.Null(card.TokenExchangeResource);
            Assert.NotNull(card.TokenPostResource);
            Assert.Equal(card.TokenPostResource.SasUrl, "sasUrl");
        }

        [Fact]
        public async void Test_VerifyStateRouteSelector_ReturnsTrue()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "invoke";
            turnContext.Activity.Name = "signin/verifyState";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", SETTING_NAME);

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.VerifyStateRouteSelector(turnContext, default);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async void Test_VerifyStateRouteSelector_IncorrectActivity_ReturnsFalse ()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "NOT INVOKE";
            turnContext.Activity.Name = "signin/verifyState";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", SETTING_NAME);

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.VerifyStateRouteSelector(turnContext, default);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async void Test_VerifyStateRouteSelector_IncorrectInvokeName_ReturnsFalse()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "invoke";
            turnContext.Activity.Name = "NOT signin/verifyState";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", SETTING_NAME);

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.VerifyStateRouteSelector(turnContext, default);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async void Test_VerifyStateRouteSelector_IncorrectSettingName_ReturnsFalse()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "invoke";
            turnContext.Activity.Name = "signin/verifyState";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", "NOT SETTING_NAME");

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.VerifyStateRouteSelector(turnContext, default);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_ReturnsTrue()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "invoke";
            turnContext.Activity.Name = "signin/tokenExchange";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", SETTING_NAME);

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.TokenExchangeRouteSelector(turnContext, default);

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_IncorrectActivity_ReturnsFalse()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "NOT invoke";
            turnContext.Activity.Name = "signin/tokenExchange";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", SETTING_NAME);

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.TokenExchangeRouteSelector(turnContext, default);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_IncorrectInvokeName_ReturnsFalse()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "invoke";
            turnContext.Activity.Name = "NOT signin/tokenExchange";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", SETTING_NAME);

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.TokenExchangeRouteSelector(turnContext, default);

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async void Test_TokenExchangeRouteSelector_IncorrectSettingName_ReturnsFalse()
        {
            // Arrange
            var testAdapter = new SimpleAdapter();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            turnContext.Activity.Type = "invoke";
            turnContext.Activity.Name = "signin/tokenExchange";
            turnContext.Activity.Value = new JObject();
            ((JObject)turnContext.Activity.Value).Add("settingName", "NOT SETTING_NAME");

            var app = new TestApplication(new() { Adapter = testAdapter });
            var botAuth = new TestOAuthBotAuthentication(app, new(), SETTING_NAME);

            // Act
            var result = await botAuth.TokenExchangeRouteSelector(turnContext, default);

            // Assert
            Assert.False(result);
        }
    }
}
