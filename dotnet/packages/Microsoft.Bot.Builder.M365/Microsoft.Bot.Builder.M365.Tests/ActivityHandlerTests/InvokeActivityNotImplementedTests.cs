// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder.M365.Tests;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Newtonsoft.Json.Linq;
using Xunit;
using Microsoft.Bot.Builder.M365.Tests.TestUtils;
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.ActivityHandlerTests
{
    public class InvokeActivityNotImplementedTests
    {
        [Fact]
        public async Task Test_InvokeActivity()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "gibberish",
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions());
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task TestMessagingExtensionConfigurationQuerySettingsUrl()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/querySettingsUrl",
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task TestMessagingExtensionConfigurationSetting()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/setting",
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(501, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentAcceptImplemented()
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandlerFileConsent(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentDeclineImplemented()
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandlerFileConsent(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewActionEditImplemented()
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandlerMessagePreview(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewActionSendImplemented()
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandlerMessagePreview(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(200, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_FileConsentBadAction()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new FileConsentCardResponse
                {
                    Action = "this.is.a.bad.action",
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
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(400, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_MessagingExtensionSubmitActionPreviewBadAction()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new MessagingExtensionAction
                {
                    BotMessagePreviewAction = "this.is.a.bad.action",
                }),
            };

            Activity[] activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }

            var turnContext = new TurnContext(new SimpleAdapter(CaptureSend), activity);
            var turnState = new TestTurnState();

            // Act
            var bot = new TestActivityHandler(new TestApplicationOptions { });
            await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.IsType<InvokeResponse>(activitiesToSend[0].Value);
            Assert.Equal(400, ((InvokeResponse)activitiesToSend[0].Value).Status);
        }

        private class TestActivityHandler : TestApplication
        {
            public TestActivityHandler(TestApplicationOptions options) : base(options)
            {
            }
        }

        private class TestActivityHandlerFileConsent : TestApplication
        {
            public TestActivityHandlerFileConsent(TestApplicationOptions options) : base(options)
            {
            }

            protected override Task OnFileConsentAcceptAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
            {
                return Task.CompletedTask;
            }

            protected override Task OnFileConsentDeclineAsync(FileConsentCardResponse fileConsentCardResponse, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
            {
                return Task.CompletedTask;
            }
        }

        private class TestActivityHandlerMessagePreview : TestApplication
        {
            public TestActivityHandlerMessagePreview(TestApplicationOptions options) : base(options)
            {
            }

            protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewEditAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
            {
                return Task.FromResult(new MessagingExtensionActionResponse());
            }

            protected override Task<MessagingExtensionActionResponse> OnMessagingExtensionBotMessagePreviewSendAsync(MessagingExtensionAction action, ITurnContext<IInvokeActivity> turnContext, TestTurnState turnState, CancellationToken cancellationToken)
            {
                return Task.FromResult(new MessagingExtensionActionResponse());
            }
        }
    }
}
