using Microsoft.Bot.Builder.M365.Tests.TestUtils;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Bot.Schema;
using Newtonsoft.Json.Linq;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.ActivityHandlerTests
{
    public class InvokeActivityTests
    {
        [Fact]
        public async Task Test_InvokeActivity()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "some.random.invoke",
            };

            var adapter = new TestInvokeAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal(200, ((InvokeResponse)((Activity)adapter.Activity).Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_SignInTokenExchangeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = SignInConstants.TokenExchangeOperationName,
            };
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSignInInvokeAsync", bot.Record[1]);
            Assert.Equal("OnSignInTokenExchangeAsync", bot.Record[2]);

        }

        [Fact]
        public async Task Test_InvokeActivity_InvokeShouldNotMatchAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "should.not.match",
            };
            var adapter = new TestInvokeAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal(501, ((InvokeResponse)((Activity)adapter.Activity).Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentAccept()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new FileConsentCardResponse
                {
                    Action = "accept",
                    UploadInfo = new FileUploadInfo
                    {
                        UniqueId = "uniqueId",
                        FileType = "fileType",
                        UploadUrl = "uploadUrl",
                    },
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnFileConsentAsync", bot.Record[1]);
            Assert.Equal("OnFileConsentAcceptAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentDecline()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new FileConsentCardResponse
                {
                    Action = "decline",
                    UploadInfo = new FileUploadInfo
                    {
                        UniqueId = "uniqueId",
                        FileType = "fileType",
                        UploadUrl = "uploadUrl",
                    },
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnFileConsentAsync", bot.Record[1]);
            Assert.Equal("OnFileConsentDeclineAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ActionableMessageExecuteAction()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "actionableMessage/executeAction",
                Value = JObject.FromObject(new O365ConnectorCardActionQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnO365ConnectorCardActionAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ComposeExtensionQueryLink()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/queryLink",
                Value = JObject.FromObject(new AppBasedLinkQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAppBasedLinkQueryAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ComposeExtensionAnonymousQueryLink()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/anonymousQueryLink",
                Value = JObject.FromObject(new AppBasedLinkQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAnonymousAppBasedLinkQueryAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_ComposeExtensionQuery()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Value = JObject.FromObject(new MessagingExtensionQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionQueryAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSelectItemAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/selectItem",
                Value = new JObject(),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSelectItemAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitAction()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionQuery()),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSubmitActionDispatchAsync", bot.Record[1]);
            Assert.Equal("OnMessagingExtensionSubmitActionAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewActionEdit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionAction
                {
                    BotMessagePreviewAction = "edit",
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSubmitActionDispatchAsync", bot.Record[1]);
            Assert.Equal("OnMessagingExtensionBotMessagePreviewEditAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewActionSend()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionAction
                {
                    BotMessagePreviewAction = "send",
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionSubmitActionDispatchAsync", bot.Record[1]);
            Assert.Equal("OnMessagingExtensionBotMessagePreviewSendAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionFetchTask()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Value = JObject.Parse(@"{""commandId"":""testCommand""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionFetchTaskAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionConfigurationQuerySettingUrl()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/querySettingUrl",
                Value = JObject.Parse(@"{""commandId"":""testCommand""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionConfigurationQuerySettingUrlAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionConfigurationSetting()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/setting",
                Value = JObject.Parse(@"{""commandId"":""testCommand""}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessagingExtensionConfigurationSettingAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TaskModuleFetch()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "task/fetch",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""task / fetch""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTaskModuleFetchAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TaskModuleSubmit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "task/submit",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""task / fetch""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTaskModuleSubmitAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TabFetch()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "tab/fetch",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""tab / fetch""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTabFetchAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_TabSubmit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "tab/submit",
                Value = JObject.Parse(@"{""data"":{""key"":""value"",""type"":""tab / submit""},""context"":{""theme"":""default""}}"),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnTabSubmitAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_SigninVerifyState()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "signin/verifyState",
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSignInInvokeAsync", bot.Record[1]);
            Assert.Equal("OnSignInVerifyStateAsync", bot.Record[2]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_OnAdaptiveCardActionExecuteAsync()
        {
            var value = JObject.FromObject(new AdaptiveCardInvokeValue { Action = new AdaptiveCardInvokeAction { Type = "Action.Execute" } });

            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "adaptiveCard/action",
                Value = value
            };

            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAdaptiveCardActionExecuteAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InvokeActivity_OnSearchInvokeAsync_NoKindOnTeamsDefaults()
        {
            // Arrange
            var value = JObject.FromObject(new SearchInvokeValue { Kind = null, QueryText = "bot" });
            var activity = GetSearchActivity(value);
            activity.ChannelId = Channels.Msteams;
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSearchInvokeAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InvokeActivity_OnSearchInvokeAsync()
        {
            // Arrange
            var value = JObject.FromObject(new SearchInvokeValue { Kind = SearchInvokeTypes.Search, QueryText = "bot" });
            var activity = GetSearchActivity(value);
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.True(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSearchInvokeAsync", bot.Record[1]);
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_NullValueThrows()
        {
            var activity = GetSearchActivity(null);
            await AssertErrorThroughInvokeAdapter(activity, "Missing value property for search");
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_InvalidValueThrows()
        {
            var activity = GetSearchActivity(new object());
            await AssertErrorThroughInvokeAdapter(activity, "Value property is not properly formed for search");
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_MissingKindThrows()
        {
            var activity = GetSearchActivity(JObject.FromObject(new SearchInvokeValue { Kind = null, QueryText = "test" }));
            await AssertErrorThroughInvokeAdapter(activity, "Missing kind property for search");
        }

        [Fact]
        public async Task TestGetSearchInvokeValue_MissingQueryTextThrows()
        {
            var activity = GetSearchActivity(JObject.FromObject(new SearchInvokeValue { Kind = SearchInvokeTypes.Typeahead }));
            await AssertErrorThroughInvokeAdapter(activity, "Missing queryText property for search");
        }

        private Activity GetSearchActivity(object value)
        {
            return new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "application/search",
                Value = value
            };
        }

        private async Task AssertErrorThroughInvokeAdapter(Activity activity, string errorMessage)
        {
            // Arrange
            var adapter = new TestInvokeAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            var sent = adapter.Activity as Activity;
            Assert.Equal(ActivityTypesEx.InvokeResponse, sent.Type);

            Assert.IsType<InvokeResponse>(sent.Value);
            var value = sent.Value as InvokeResponse;
            Assert.Equal(400, value.Status);

            Assert.IsType<AdaptiveCardInvokeResponse>(value.Body);
            var body = value.Body as AdaptiveCardInvokeResponse;
            Assert.Equal("application/vnd.microsoft.error", body.Type);
            Assert.Equal(400, body.StatusCode);

            Assert.IsType<Error>(body.Value);
            var error = body.Value as Error;
            Assert.Equal("BadRequest", error.Code);
            Assert.Equal(errorMessage, error.Message);
        }
    }
}
