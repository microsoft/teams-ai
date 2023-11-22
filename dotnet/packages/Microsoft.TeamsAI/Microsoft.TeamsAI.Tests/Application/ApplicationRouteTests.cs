using Microsoft.Bot.Builder;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;
using Record = Microsoft.Teams.AI.State.Record;
using Activity = Microsoft.Bot.Schema.Activity;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class ApplicationRouteTests
    {
        [Fact]
        public async Task Test_Application_Route()
        {
            // Arrange
            var activity1 = MessageFactory.Text("hello.1");
            activity1.Recipient = new() { Id = "recipientId" };
            activity1.Conversation = new() { Id = "conversationId" };
            activity1.From = new() { Id = "fromId" };
            activity1.ChannelId = "channelId";
            var activity2 = MessageFactory.Text("hello.2");
            activity2.Recipient = new() { Id = "recipientId" };
            activity2.Conversation = new() { Id = "conversationId" };
            activity2.From = new() { Id = "fromId" };
            activity2.ChannelId = "channelId";
            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var messages = new List<string>();
            app.AddRoute(
                (context, _) =>
                Task.FromResult(string.Equals("hello.1", context.Activity.Text)),
                (context, _, _) =>
                {
                    messages.Add(context.Activity.Text);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(messages);
            Assert.Equal("hello.1", messages[0]);
        }

        [Fact]
        public async Task Test_Application_Routes_Are_Called_InOrder()
        {
            // Arrange
            var activity = MessageFactory.Text("hello.1");
            activity.Recipient = new() { Id = "recipientId" };
            activity.Conversation = new() { Id = "conversationId" };
            activity.From = new() { Id = "fromId" };
            activity.ChannelId = "channelId";
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("hello", context.Activity.Text)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                false);
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("hello.1", context.Activity.Text)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                false);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(2);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(1, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_Application_InvokeRoute()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.2",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var turnContext2 = new TurnContext(adapter, activity2);

            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke.1", context.Activity.Name)),
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                },
                true);

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(names);
            Assert.Equal("invoke.1", names[0]);
        }

        [Fact]
        public async Task Test_Application_InvokeRoutes_Are_Called_InOrder()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke", context.Activity.Name)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke.1", context.Activity.Name)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(2);
                    return Task.CompletedTask;
                },
                true);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(1, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_Application_InvokeRoutes_Are_Called_First()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(0, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_Application_No_InvokeRoute_Matched_Fallback_To_Routes()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var selectedRoutes = new List<int>();
            app.AddRoute(
                (_, _) => Task.FromResult(false),
                (context, _, _) =>
                {
                    selectedRoutes.Add(0);
                    return Task.CompletedTask;
                },
                true);
            app.AddRoute(
                (context, _) => Task.FromResult(string.Equals("invoke.1", context.Activity.Name)),
                (context, _, _) =>
                {
                    selectedRoutes.Add(1);
                    return Task.CompletedTask;
                },
                false);
            app.AddRoute(
                (_, _) => Task.FromResult(true),
                (context, _, _) =>
                {
                    selectedRoutes.Add(2);
                    return Task.CompletedTask;
                },
                false);

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(selectedRoutes);
            Assert.Equal(1, selectedRoutes[0]);
        }

        [Fact]
        public async Task Test_OnActivity_String_Selector()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var types = new List<string>();
            app.OnActivity(ActivityTypes.Message, (context, _, _) =>
            {
                types.Add(context.Activity.Type);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(types);
            Assert.Equal(ActivityTypes.Message, types[0]);
        }

        [Fact]
        public async Task Test_OnActivity_Regex_Selector()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var types = new List<string>();
            app.OnActivity(new Regex("^message$"), (context, _, _) =>
            {
                types.Add(context.Activity.Type);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(types);
            Assert.Equal(ActivityTypes.Message, types[0]);
        }

        [Fact]
        public async Task Test_OnActivity_Function_Selector()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Name = "Message",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var types = new List<string>();
            app.OnActivity((context, _) => Task.FromResult(context.Activity?.Name != null), (context, _, _) =>
            {
                types.Add(context.Activity.Type);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(types);
            Assert.Equal(ActivityTypes.Message, types[0]);
        }

        [Fact]
        public async Task Test_OnActivity_Multiple_Selectors()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                Name = "Delete",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var types = new List<string>();
            app.OnActivity(new MultipleRouteSelector
            {
                Strings = new[] { ActivityTypes.Invoke },
                Regexes = new[] { new Regex("^message$") },
                RouteSelectors = new RouteSelectorAsync[] { (context, _) => Task.FromResult(context.Activity?.Name != null) },
            },
            (context, _, _) =>
            {
                types.Add(context.Activity.Type);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Equal(3, types.Count);
            Assert.Equal(ActivityTypes.Message, types[0]);
            Assert.Equal(ActivityTypes.MessageDelete, types[1]);
            Assert.Equal(ActivityTypes.Invoke, types[2]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_MembersAdded()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount> { new() },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.MembersAdded, (context, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_MembersRemoved()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount> { new() },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.MembersRemoved, (context, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_ChannelCreated()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelCreated",
                    Channel = new ChannelInfo(),
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.ChannelCreated,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_ChannelRenamed()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelRenamed",
                    Channel = new ChannelInfo(),
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.ChannelRenamed,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_ChannelDeleted()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelDeleted",
                    Channel = new ChannelInfo(),
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.ChannelDeleted,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }


        [Fact]
        public async Task Test_OnConversationUpdate_ChannelRestored()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelRestored",
                    Channel = new ChannelInfo(),
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.ChannelRestored,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_TeamRenamed()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamRenamed,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_TeamDeleted()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamDeleted",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamDeleted,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_TeamHardDeleted()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamHardDeleted",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamHardDeleted,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_TeamArchived()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamArchived",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamArchived,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_TeamUnarchived()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamUnarchived",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamUnarchived,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_TeamRestored()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRestored",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamRestored,
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Equal(1, names.Count);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_SingleEvent()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed",
                    Team = new TeamInfo(),
                },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },

            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(ConversationUpdateEvents.TeamRenamed, (context, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_MultipleEvents()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount> { new() },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelDeleted",
                    Channel = new ChannelInfo(),
                    Team = new TeamInfo(),
                },
                Name = "2",
                ChannelId = Channels.Msteams,
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                ChannelId = Channels.Msteams,
            };
            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(
                new[] { ConversationUpdateEvents.TeamRenamed, ConversationUpdateEvents.ChannelDeleted, ConversationUpdateEvents.MembersAdded },
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Equal(2, names.Count);
            Assert.Equal("1", names[0]);
            Assert.Equal("2", names[1]);
        }

        [Fact]
        public async Task Test_OnConversationUpdate_BypassNonTeamsEvent()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount> { new() },
                Name = "1",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelDeleted"
                },
                Name = "2",
                ChannelId = Channels.Directline,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                ChannelId = Channels.Directline,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConversationUpdate(
                new[] { ConversationUpdateEvents.TeamRenamed, ConversationUpdateEvents.ChannelDeleted, ConversationUpdateEvents.MembersAdded },
                (context, _, _) =>
                {
                    names.Add(context.Activity.Name);
                    return Task.CompletedTask;
                });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnMessage_String_Selector()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "hello a",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "welcome",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Text = "hello b",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var texts = new List<string>();
            app.OnMessage("hello", (context, _, _) =>
            {
                texts.Add(context.Activity.Text);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(texts);
            Assert.Equal("hello a", texts[0]);
        }

        [Fact]
        public async Task Test_OnMessage_Regex_Selector()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "hello",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "welcome",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Text = "hello",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var texts = new List<string>();
            app.OnMessage(new Regex("llo"), (context, _, _) =>
            {
                texts.Add(context.Activity.Text);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(texts);
            Assert.Equal("hello", texts[0]);
        }

        [Fact]
        public async Task Test_OnMessage_Function_Selector()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "hello",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var texts = new List<string>();
            app.OnMessage((context, _) => Task.FromResult(context.Activity?.Text != null), (context, _, _) =>
            {
                texts.Add(context.Activity.Text);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);

            // Assert
            Assert.Single(texts);
            Assert.Equal("hello", texts[0]);
        }

        [Fact]
        public async Task Test_OnMessage_Multiple_Selectors()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "hello a",
                Name = "hello",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "welcome",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "hello world",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var texts = new List<string>();
            app.OnMessage(new MultipleRouteSelector
            {
                Strings = new[] { "world" },
                Regexes = new[] { new Regex("come") },
                RouteSelectors = new RouteSelectorAsync[] { (context, _) => Task.FromResult(context.Activity?.Name != null) },
            },
            (context, _, _) =>
            {
                texts.Add(context.Activity.Text);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Equal(3, texts.Count);
            Assert.Equal("hello a", texts[0]);
            Assert.Equal("welcome", texts[1]);
            Assert.Equal("hello world", texts[2]);
        }

        [Fact]
        public async Task Test_OnMessageEdit()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "editMessage"
                },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "softDeleteMessage"
                }
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message
            };
            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnMessageEdit((turnContext, _, _) =>
            {
                names.Add(turnContext.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnMessageUnDelete()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "undeleteMessage"
                },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "softDeleteMessage"
                }
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message
            };
            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnMessageUndelete((turnContext, _, _) =>
            {
                names.Add(turnContext.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnMessageDelete()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "softDeleteMessage"
                },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "unknown"
                },
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnMessageDelete((turnContext, _, _) =>
            {
                names.Add(turnContext.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnMessageReactionsAdded()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.MessageReaction,
                ReactionsAdded = new List<MessageReaction> { new() },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageReaction,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnMessageReactionsAdded((context, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnMessageReactionsRemoved()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.MessageReaction,
                ReactionsRemoved = new List<MessageReaction> { new() },
                Name = "1",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageReaction,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnMessageReactionsRemoved((context, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(names);
            Assert.Equal("1", names[0]);
        }

        [Fact]
        public async Task Test_OnConfigFetch()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/fetch",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/fetch",
                ChannelId = Channels.Outlook,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/submit",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity4 = new Activity
            {
                Type = ActivityTypes.Message,
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnContext4 = new TurnContext(adapter, activity4);
            var configResponseMock = new Mock<ConfigResponseBase>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = configResponseMock.Object
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConfigFetch((turnContext, _, _, _) =>
            {
                names.Add(turnContext.Activity.Name);
                return Task.FromResult(configResponseMock.Object);
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);
            await app.OnTurnAsync(turnContext4);

            // Assert
            Assert.Single(names);
            Assert.Equal("config/fetch", names[0]);
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async Task Test_OnConfigSubmit()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            object data = new
            {
                testKey = "testValue"
            };
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/submit",
                ChannelId = Channels.Msteams,
                Value = JObject.FromObject(data),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/submit",
                ChannelId = Channels.Outlook,
                Value = JObject.FromObject(data),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/fetch",
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var activity4 = new Activity
            {
                Type = ActivityTypes.Message,
                ChannelId = Channels.Msteams,
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnContext4 = new TurnContext(adapter, activity4);
            var configResponseMock = new Mock<ConfigResponseBase>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = configResponseMock.Object
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnConfigSubmit((turnContext, _, configData, _) =>
            {
                Assert.NotNull(configData);
                Assert.Equal(configData, configData as JObject);
                names.Add(turnContext.Activity.Name);
                return Task.FromResult(configResponseMock.Object);
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);
            await app.OnTurnAsync(turnContext4);

            // Assert
            Assert.Single(names);
            Assert.Equal("config/submit", names[0]);
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async Task Test_OnFileConsentAccept()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new
                {
                    action = "accept"
                }),
                Id = "test",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new
                {
                    action = "decline"
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/queryLink",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var expectedInvokeResponse = new InvokeResponse
            {
                Status = 200
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.OnFileConsentAccept((turnContext, _, _, _) =>
            {
                ids.Add(turnContext.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(ids);
            Assert.Equal("test", ids[0]);
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async Task Test_OnFileConsentDecline()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new
                {
                    action = "decline"
                }),
                Id = "test",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "fileConsent/invoke",
                Value = JObject.FromObject(new
                {
                    action = "accept"
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/queryLink",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var expectedInvokeResponse = new InvokeResponse
            {
                Status = 200
            };
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.OnFileConsentDecline((turnContext, _, _, _) =>
            {
                ids.Add(turnContext.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(ids);
            Assert.Equal("test", ids[0]);
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async Task Test_OnO365ConnectorCardAction()
        {
            // Arrange
            Activity[]? activitiesToSend = null;
            void CaptureSend(Activity[] arg)
            {
                activitiesToSend = arg;
            }
            var adapter = new SimpleAdapter(CaptureSend);
            var activity1 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "actionableMessage/executeAction",
                Value = new { },
                Id = "test",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Event,
                Name = "actionableMessage/executeAction",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "composeExtension/queryLink",
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
                ChannelId = "channelId"
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var expectedInvokeResponse = new InvokeResponse
            {
                Status = 200
            };
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext1);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.OnO365ConnectorCardAction((turnContext, _, _, _) =>
            {
                ids.Add(turnContext.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext1);
            await app.OnTurnAsync(turnContext2);
            await app.OnTurnAsync(turnContext3);

            // Assert
            Assert.Single(ids);
            Assert.Equal("test", ids[0]);
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }

        [Fact]
        public async Task Test_OnTeamsReadReceipt()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
                ChannelId = Channels.Msteams,
                Name = "application/vnd.microsoft.readReceipt",
                Value = JObject.FromObject(new
                {
                    lastReadMessageId = "10101010",
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnTeamsReadReceipt((context, _, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Single(names);
            Assert.Equal("application/vnd.microsoft.readReceipt", names[0]);
        }

        [Fact]
        public async Task Test_OnTeamsReadReceipt_IncorrectName()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
                ChannelId = Channels.Msteams,
                Name = "application/vnd.microsoft.meetingStart",
                Value = JObject.FromObject(new
                {
                    lastReadMessageId = "10101010",
                }),
                Recipient = new() { Id = "recipientId" },
                Conversation = new() { Id = "conversationId" },
                From = new() { Id = "fromId" },
            };
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContext);
            var app = new Application<TurnState>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var names = new List<string>();
            app.OnTeamsReadReceipt((context, _, _, _) =>
            {
                names.Add(context.Activity.Name);
                return Task.CompletedTask;
            });

            // Act
            await app.OnTurnAsync(turnContext);

            // Assert
            Assert.Empty(names);
        }
    }
}
