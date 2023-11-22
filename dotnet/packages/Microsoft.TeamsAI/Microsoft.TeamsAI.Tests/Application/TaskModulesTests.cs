using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using Newtonsoft.Json.Linq;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class TaskModulesTests
    {
        [Fact]
        public async void Test_OnFetch_Verb()
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
                Name = "task/fetch",
                Value = JObject.FromObject(new
                {
                    data = new
                    {
                        msteams = new
                        {
                            type = "task/fetch",
                        },
                        verb = "test-verb",
                    }
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
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            FetchHandler<TurnState> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.TaskModules.OnFetch("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnFetch_Verb_NotHit()
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
                Name = "task/fetch",
                Value = JObject.FromObject(new
                {
                    data = new
                    {
                        msteams = new
                        {
                            type = "task/fetch",
                        },
                        verb = "not-test-verb",
                    }
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            FetchHandler<TurnState> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.TaskModules.OnFetch("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnFetch_RouteSelector_ActivityNotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "task/fetch",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            FetchHandler<TurnState> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.TaskModules.OnFetch(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected TaskModules.OnFetch() triggered for activity type: invoke", exception.Message);
        }

        [Fact]
        public async void Test_OnSubmit_Verb()
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
                Name = "task/submit",
                Value = JObject.FromObject(new
                {
                    data = new
                    {
                        msteams = new
                        {
                            type = "task/submit",
                        },
                        verb = "test-verb",
                    }
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
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            SubmitHandler<TurnState> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.TaskModules.OnSubmit("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async void Test_OnSubmit_Verb_NotHit()
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
                Name = "task/submit",
                Value = JObject.FromObject(new
                {
                    data = new
                    {
                        msteams = new
                        {
                            type = "task/submit",
                        },
                        verb = "not-test-verb",
                    }
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });

            SubmitHandler<TurnState> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.TaskModules.OnSubmit("test-verb", handler);
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Null(activitiesToSend);
        }

        [Fact]
        public async void Test_OnSubmit_RouteSelector_ActivityNotMatched()
        {
            var adapter = new SimpleAdapter();
            var turnContext = new TurnContext(adapter, new Activity()
            {
                Type = ActivityTypes.Invoke,
                Name = "task/submit",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            });
            var taskModuleResponseMock = new Mock<TaskModuleResponse>();
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            RouteSelector routeSelector = (turnContext, cancellationToken) =>
            {
                return Task.FromResult(true);
            };
            SubmitHandler<TurnState> handler = (turnContext, turnState, data, cancellationToken) =>
            {
                return Task.FromResult(taskModuleResponseMock.Object);
            };

            // Act
            app.TaskModules.OnSubmit(routeSelector, handler);
            var exception = await Assert.ThrowsAsync<TeamsAIException>(async () => await app.OnTurnAsync(turnContext));

            // Assert
            Assert.Equal("Unexpected TaskModules.OnSubmit() triggered for activity type: invoke", exception.Message);
        }
    }
}
