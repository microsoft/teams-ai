using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Identity.Client;
using Moq;
using Microsoft.Bot.Builder.Adapters;
using Microsoft.Bot.Connector;
using System.Text.Json;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI.Tests.Application.Authentication.Bot
{
    public class TeamsSsoPromptTests
    {
        private const string TokenExchangeSuccess = "TokenExchangeSuccess";
        private const string TokenExchangeFail = "TokenExchangeFail";
        private const string DialogId = "DialogId";
        private const string PromptName = "PromptName";
        private const string ClientId = "ClientId";
        private const string TenantId = "TenantId";
        private const string UserReadScope = "User.Read";
        private const string AuthStartPage = "https://localhost/auth-start.html";
        private const string AccessToken = "test token";

        private sealed class TeamsSsoPromptMock : TeamsSsoPrompt
        {
            public TeamsSsoPromptMock(string dialogId, string name, TeamsSsoSettings settings, IConfidentialClientApplicationAdapter msalAdapterMock) : base(dialogId, name, settings)
            {
                _msalAdapter = msalAdapterMock;
            }
        }

        [Fact]
        public async Task BeginDialogAsync_SendOAuthCard()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var testFlow = InitTestFlow(msalAdapterMock.Object);

            // Act and Assert
            await testFlow
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Text = "hello",
                    Conversation = new ConversationAccount() { Id = "testUserId" }
                })
                .AssertReply(activity =>
                {
                    Assert.Equal(1, ((Activity)activity).Attachments.Count);
                    Assert.Equal(OAuthCard.ContentType, ((Activity)activity).Attachments[0].ContentType);
                    OAuthCard? card = ((Activity)activity).Attachments[0].Content as OAuthCard;
                    Assert.NotNull(card);
                    Assert.Equal(1, card.Buttons.Count);
                    Assert.Equal(ActionTypes.Signin, card!.Buttons[0].Type);
                    Assert.Equal($"{AuthStartPage}?scope={UserReadScope}&clientId={ClientId}&tenantId={TenantId}", card!.Buttons[0].Value);
                })
                .StartTestAsync();
        }

        [Fact]
        public async Task ContinueDialogAsync_TokenExchangeSuccess()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var authenticationResult = MockAuthenticationResult();
            msalAdapterMock.Setup(m => m.InitiateLongRunningProcessInWebApi(It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), ref It.Ref<string>.IsAny)).ReturnsAsync(authenticationResult);

            var testFlow = InitTestFlow(msalAdapterMock.Object);

            // Act and Assert
            await testFlow
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Text = "hello",
                    Conversation = new ConversationAccount() { Id = "testUserId" }
                })
                .AssertReply(activity =>
                {
                    Assert.Equal(1, ((Activity)activity).Attachments.Count);
                    Assert.Equal(OAuthCard.ContentType, ((Activity)activity).Attachments[0].ContentType);
                    OAuthCard? card = ((Activity)activity).Attachments[0].Content as OAuthCard;
                    Assert.NotNull(card);
                    Assert.Equal(1, card.Buttons.Count);
                    Assert.Equal(ActionTypes.Signin, card!.Buttons[0].Type);
                    Assert.Equal($"{AuthStartPage}?scope={UserReadScope}&clientId={ClientId}&tenantId={TenantId}", card!.Buttons[0].Value);
                })
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Type = ActivityTypes.Invoke,
                    Name = SignInConstants.TokenExchangeOperationName,
                    Value = JObject.FromObject(new TokenExchangeInvokeRequest()
                    {
                        Id = "fake_id",
                        Token = "fake_token"
                    })
                })
                .AssertReply(a =>
                {
                    Assert.Equal(ActivityTypesEx.InvokeResponse, a.Type);
                    var response = ((Activity)a).Value as InvokeResponse;
                    Assert.NotNull(response);
                    Assert.Equal(200, response!.Status);
                })
                .AssertReply(TokenExchangeSuccess)
                .AssertReply(activity =>
                {
                    var response = JsonSerializer.Deserialize<TokenResponse>(((Activity)activity).Text);
                    Assert.Equal(authenticationResult.AccessToken, response!.Token);
                    Assert.Equal(authenticationResult.ExpiresOn.ToString("O"), response!.Expiration);
                })
                .StartTestAsync();
        }

        [Fact]
        public async Task ContinueDialogAsync_TokenExchangeFail()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            msalAdapterMock.Setup(m => m.InitiateLongRunningProcessInWebApi(It.IsAny<IEnumerable<string>>(), It.IsAny<string>(), ref It.Ref<string>.IsAny)).Throws(new MsalUiRequiredException("error code", "error message"));

            var testFlow = InitTestFlow(msalAdapterMock.Object);

            // Act and Assert
            await testFlow
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Text = "hello",
                    Conversation = new ConversationAccount() { Id = "testUserId" }
                })
                .AssertReply(activity =>
                {
                    Assert.Equal(1, ((Activity)activity).Attachments.Count);
                    Assert.Equal(OAuthCard.ContentType, ((Activity)activity).Attachments[0].ContentType);
                    OAuthCard? card = ((Activity)activity).Attachments[0].Content as OAuthCard;
                    Assert.NotNull(card);
                    Assert.Equal(1, card.Buttons.Count);
                    Assert.Equal(ActionTypes.Signin, card!.Buttons[0].Type);
                    Assert.Equal($"{AuthStartPage}?scope={UserReadScope}&clientId={ClientId}&tenantId={TenantId}", card!.Buttons[0].Value);
                })
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Type = ActivityTypes.Invoke,
                    Name = SignInConstants.TokenExchangeOperationName,
                    Value = JObject.FromObject(new TokenExchangeInvokeRequest()
                    {
                        Id = "fake_id",
                        Token = "fake_token"
                    })
                })
                .AssertReply(a =>
                {
                    Assert.Equal(ActivityTypesEx.InvokeResponse, a.Type);
                    var response = ((Activity)a).Value as InvokeResponse;
                    Assert.NotNull(response);
                    Assert.Equal(412, response!.Status);
                })
                .StartTestAsync();
        }

        [Fact]
        public async Task ContinueDialogAsync_SignInVerify()
        {
            // Arrange
            var msalAdapterMock = MockMsalAdapter();
            var testFlow = InitTestFlow(msalAdapterMock.Object);

            // Act and Assert
            await testFlow
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Text = "hello",
                    Conversation = new ConversationAccount() { Id = "testUserId" }
                })
                .AssertReply(activity =>
                {
                    Assert.Equal(1, ((Activity)activity).Attachments.Count);
                    Assert.Equal(OAuthCard.ContentType, ((Activity)activity).Attachments[0].ContentType);
                    OAuthCard? card = ((Activity)activity).Attachments[0].Content as OAuthCard;
                    Assert.NotNull(card);
                    Assert.Equal(1, card.Buttons.Count);
                    Assert.Equal(ActionTypes.Signin, card!.Buttons[0].Type);
                    Assert.Equal($"{AuthStartPage}?scope={UserReadScope}&clientId={ClientId}&tenantId={TenantId}", card!.Buttons[0].Value);
                })
                .Send(new Activity()
                {
                    ChannelId = Channels.Msteams,
                    Type = ActivityTypes.Invoke,
                    Name = SignInConstants.VerifyStateOperationName
                })
                .AssertReply(activity =>
                {
                    Assert.Equal(1, ((Activity)activity).Attachments.Count);
                    Assert.Equal(OAuthCard.ContentType, ((Activity)activity).Attachments[0].ContentType);
                    OAuthCard? card = ((Activity)activity).Attachments[0].Content as OAuthCard;
                    Assert.NotNull(card);
                    Assert.Equal(1, card.Buttons.Count);
                    Assert.Equal(ActionTypes.Signin, card!.Buttons[0].Type);
                    Assert.Equal($"{AuthStartPage}?scope={UserReadScope}&clientId={ClientId}&tenantId={TenantId}", card!.Buttons[0].Value);
                })
                .AssertReply(a =>
                {
                    Assert.Equal(ActivityTypesEx.InvokeResponse, a.Type);
                    var response = ((Activity)a).Value as InvokeResponse;
                    Assert.NotNull(response);
                    Assert.Equal(200, response!.Status);
                })
                .StartTestAsync();
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

        private static TeamsSsoPrompt CreateTeamsSsoPrompt(IConfidentialClientApplicationAdapter msalAdapterMock)
        {
            var settings = new TeamsSsoSettings(new string[] { UserReadScope }, AuthStartPage, It.IsAny<IConfidentialClientApplication>());
            var teamsSsoPrompt = new TeamsSsoPromptMock(DialogId, PromptName, settings, msalAdapterMock);
            return teamsSsoPrompt;
        }

        private static TestFlow InitTestFlow(IConfidentialClientApplicationAdapter msalAdapterMock)
        {
            var teamsSsoPrompt = CreateTeamsSsoPrompt(msalAdapterMock);
            var conversationState = new ConversationState(new MemoryStorage());
            var dialogState = conversationState.CreateProperty<DialogState>("dialogState");
            var dialogs = new DialogSet(dialogState);
            dialogs.Add(teamsSsoPrompt);

            var adapter = new TestAdapter()
                .Use(new AutoSaveStateMiddleware(conversationState));

            BotCallbackHandler botCallbackHandler = async (turnContext, cancellationToken) =>
            {
                var dc = await dialogs.CreateContextAsync(turnContext, cancellationToken);

                var results = await dc.ContinueDialogAsync(cancellationToken);
                if (results.Status == DialogTurnStatus.Empty)
                {
                    await dc.PromptAsync(DialogId, new PromptOptions(), cancellationToken);
                }
                else if (results.Status == DialogTurnStatus.Complete)
                {
                    if (results.Result is TokenResponse)
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text(TokenExchangeSuccess), cancellationToken);
                        await turnContext.SendActivityAsync(MessageFactory.Text(JsonSerializer.Serialize(results.Result)), cancellationToken);
                    }
                    else
                    {
                        await turnContext.SendActivityAsync(MessageFactory.Text(TokenExchangeFail), cancellationToken);
                    }
                }
            };

            return new TestFlow(adapter, botCallbackHandler);
        }
    }
}
