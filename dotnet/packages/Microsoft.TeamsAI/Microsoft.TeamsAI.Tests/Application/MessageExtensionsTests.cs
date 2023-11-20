using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class MessageExtensionsTests
    {
        [Fact]
        public async void Test_OnSubmitAction_CommandId()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    data = new
                    {
                        title = "test-title",
                        content = "test-content"
                    }
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var actionResponseMock = new Mock<MessagingExtensionActionResponse>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = actionResponseMock.Object
            };
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            SubmitActionHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                MessageExtensionActionData actionData = Cast<MessageExtensionActionData>(data);
                Assert.Equal("test-title", actionData.Title);
                Assert.Equal("test-content", actionData.Content);
                return Task.FromResult(actionResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnSubmitAction("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnSubmitAction_CommandId_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    data = new
                    {
                        title = "test-title",
                        content = "test-content"
                    }
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var actionResponseMock = new Mock<MessagingExtensionActionResponse>();
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            SubmitActionHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                MessageExtensionActionData actionData = Cast<MessageExtensionActionData>(data);
                Assert.Equal("test-title", actionData.Title);
                Assert.Equal("test-content", actionData.Content);
                return Task.FromResult(actionResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnSubmitAction("not-test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnSubmitAction_RouteSelector_ActivityNotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var actionResponseMock = new Mock<MessagingExtensionActionResponse>();
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            SubmitActionHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(actionResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnSubmitAction(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected MessageExtensions.OnSubmitAction() triggered for activity type: invoke", exception.Message);
        }

        [Fact]
        public async void Test_OnBotMessagePreviewEdit_CommandId()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity = new Activity()
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    botMessagePreviewAction = "edit",
                    botActivityPreview = new List<Activity> { activity }
                }, new JsonSerializer() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var actionResponseMock = new Mock<MessagingExtensionActionResponse>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = actionResponseMock.Object,
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,

            });
            BotMessagePreviewEditHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, activityPreview, cancellationToken) =>
            {
                Assert.Equivalent(activity, activityPreview);
                return Task.FromResult(actionResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnBotMessagePreviewEdit("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnBotMessagePreviewEdit_CommandId_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity = new Activity()
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    botMessagePreviewAction = "send",
                    botActivityPreview = new List<Activity> { activity }
                }, new JsonSerializer() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var actionResponseMock = new Mock<MessagingExtensionActionResponse>();
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            BotMessagePreviewEditHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, activityPreview, cancellationToken) =>
            {
                Assert.Equivalent(activity, activityPreview);
                return Task.FromResult(actionResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnBotMessagePreviewEdit("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnBotMessagePreviewEdit_RouteSelector_ActivityNotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var actionResponseMock = new Mock<MessagingExtensionActionResponse>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            BotMessagePreviewEditHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(actionResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnBotMessagePreviewEdit(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected MessageExtensions.OnBotMessagePreviewEdit() triggered for activity type: invoke", exception.Message);
        }

        [Fact]
        public async void Test_OnBotMessagePreviewSend_CommandId()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity = new Activity()
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    botMessagePreviewAction = "send",
                    botActivityPreview = new List<Activity> { activity }
                }, new JsonSerializer() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            BotMessagePreviewSendHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, activityPreview, cancellationToken) =>
            {
                Assert.Equivalent(activity, activityPreview);
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnBotMessagePreviewSend("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnBotMessagePreviewSend_CommandId_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity = new Activity()
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    botMessagePreviewAction = "edit",
                    botActivityPreview = new List<Activity> { activity }
                }, new JsonSerializer() { ReferenceLoopHandling = ReferenceLoopHandling.Ignore }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            BotMessagePreviewSendHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, activityPreview, cancellationToken) =>
            {
                Assert.Equivalent(activity, activityPreview);
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnBotMessagePreviewSend("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnBotMessagePreviewSend_RouteSelector_ActivityNotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            BotMessagePreviewSendHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnBotMessagePreviewSend(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected MessageExtensions.OnBotMessagePreviewSend() triggered for activity type: invoke", exception.Message);
        }

        [Fact]
        public async void Test_OnFetchTask_CommandId()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = taskModuleResponseMock.Object
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            FetchTaskHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnFetchTask("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnFetchTask_CommandId_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/fetchTask",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            FetchTaskHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnFetchTask("not-test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnFetchTask_RouteSelector_ActivityNotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/submitAction",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            FetchTaskHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.MessageExtensions.OnFetchTask(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected MessageExtensions.OnFetchTask() triggered for activity type: invoke", exception.Message);
        }

        [Fact]
        public async void Test_OnQuery_CommandId()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    parameters = new List<MessagingExtensionParameter>
                    {
                        new("test-name", "test-value")
                    },
                    queryOptions = new
                    {
                        count = 10,
                        skip = 0
                    }
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
                {
                    ComposeExtension = messagingExtensionResultMock.Object
                }
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            QueryHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, query, cancellationToken) =>
            {
                Assert.Equal(1, query.Parameters.Count);
                Assert.Equal("test-value", query.Parameters["test-name"]);
                Assert.Equal(10, query.Count);
                Assert.Equal(0, query.Skip);
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnQuery("test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnQuery_CommandId_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Value = JObject.FromObject(new
                {
                    commandId = "test-command",
                    parameters = new List<MessagingExtensionParameter>
                    {
                        new("test-name", "test-value")
                    },
                    queryOptions = new
                    {
                        count = 10,
                        skip = 0
                    }
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            QueryHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, query, cancellationToken) =>
            {
                Assert.Equal(1, query.Parameters.Count);
                Assert.Equal("test-value", query.Parameters["test-name"]);
                Assert.Equal(10, query.Count);
                Assert.Equal(0, query.Skip);
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnQuery("not-test-command", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnQuery_RouteSelector_NotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/selectItem",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            QueryHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnQuery(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected MessageExtensions.OnQuery() triggered for activity type: invoke", exception.Message);
        }

        [Fact]
        public async void Test_SelectItem()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/selectItem",
                Value = JObject.FromObject(new { }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
                {
                    ComposeExtension = messagingExtensionResultMock.Object
                }
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            SelectItemHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, item, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnSelectItem(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_SelectItem_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Value = JObject.FromObject(new { }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
                {
                    ComposeExtension = messagingExtensionResultMock.Object
                }
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            SelectItemHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, item, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnSelectItem(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnQueryLink()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/queryLink",
                Value = JObject.FromObject(new
                {
                    url = "test-url"
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
                {
                    ComposeExtension = messagingExtensionResultMock.Object
                }
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            QueryLinkHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, url, cancellationToken) =>
            {
                Assert.Equal("test-url", url);
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnQueryLink(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnQueryLink_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            QueryLinkHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, url, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnQueryLink(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnAnonymousQueryLink()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/anonymousQueryLink",
                Value = JObject.FromObject(new
                {
                    url = "test-url"
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
                {
                    ComposeExtension = messagingExtensionResultMock.Object
                }
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            QueryLinkHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, url, cancellationToken) =>
            {
                Assert.Equal("test-url", url);
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnAnonymousQueryLink(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnAnonymousQueryLink_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/query",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            QueryLinkHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, url, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnAnonymousQueryLink(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnQueryUrlSetting()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/querySettingUrl",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = new MessagingExtensionActionResponse()
                {
                    ComposeExtension = messagingExtensionResultMock.Object
                }
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                TurnStateFactory = () => turnState.Result,
            });
            QueryUrlSettingHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnQueryUrlSetting(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnQueryUrlSetting_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/settings",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var messagingExtensionResultMock = new Mock<MessagingExtensionResult>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                TurnStateFactory = () => turnState.Result,
            });
            QueryLinkHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, url, cancellationToken) =>
            {
                return Task.FromResult(messagingExtensionResultMock.Object);
            };

            // Act
            app.MessageExtensions.OnAnonymousQueryLink(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnConfigureSettings()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/setting",
                Value = JObject.FromObject(new
                {
                    state = "test-state"
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                TurnStateFactory = () => turnState.Result,
            });
            ConfigureSettingsHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, settings, cancellationToken) =>
            {
                JObject? obj = settings as JObject;
                Assert.NotNull(obj);
                Assert.Equal("test-state", obj["state"]);
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnConfigureSettings(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnConfigureSettings_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/querySettingUrl",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                TurnStateFactory = () => turnState.Result,
            });
            ConfigureSettingsHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, settings, cancellationToken) =>
            {
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnConfigureSettings(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnCardButtonClicked()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/onCardButtonClicked",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                TurnStateFactory = () => turnState.Result,
            });
            CardButtonClickedHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, cardData, cancellationToken) =>
            {
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnCardButtonClicked(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnCardButtonClicked_NotHit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/querySettingUrl",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                TurnStateFactory = () => turnState.Result,
            });
            CardButtonClickedHandler<TurnState<Record, Record, TempState>> handler = (turnContext, turnState, cardData, cancellationToken) =>
            {
                return Task.CompletedTask;
            };

            // Act
            app.MessageExtensions.OnCardButtonClicked(handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        private static T Cast<T>(object data)
        {
            JObject? obj = data as JObject;
            Assert.NotNull(obj);
            T? result = obj.ToObject<T>();
            Assert.NotNull(result);
            return result;
        }

        private sealed class MessageExtensionActionData
        {
            [JsonProperty("title")]
            public string? Title { get; set; }

            [JsonProperty("content")]
            public string? Content { get; set; }
        }
    }
}
