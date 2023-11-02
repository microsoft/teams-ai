using Microsoft.Bot.Builder;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Microsoft.TeamsAI.Tests.TestUtils;
using Moq;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;

namespace Microsoft.TeamsAI.Tests.Application
{
    public class ApplicationRouteTests
    {
        [Fact]
        public async Task Test_Application_Route()
        {
            // Arrange
            var activity1 = MessageFactory.Text("hello.1");
            var activity2 = MessageFactory.Text("hello.2");

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "invoke.2",
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
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
                Name = "invoke.1"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
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
                Name = "invoke.1"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
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
                Name = "invoke.1"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext = new TurnContext(adapter, activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                StartTypingTimer = false
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
                Type = ActivityTypes.Message
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Type = ActivityTypes.Message
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageDelete
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Name = "Message"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Type = ActivityTypes.Message
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                Name = "Delete"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
            });
            var types = new List<string>();
            app.OnActivity(new MultipleRouteSelector
            {
                Strings = new[] { ActivityTypes.Invoke },
                Regexes = new[] { new Regex("^message$") },
                RouteSelectors = new RouteSelector[] { (context, _) => Task.FromResult(context.Activity?.Name != null) },
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
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
        public async Task Test_OnConversationUpdate_SingleEvent()
        {
            // Arrange
            var activity1 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                Name = "1",
                ChannelId = "msteams"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelId = "msteams"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                ChannelId = "msteams"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                ChannelId = "msteams"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelDeleted"
                },
                Name = "2",
                ChannelId = "msteams"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                ChannelId = "msteams"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                ChannelId = "msteams"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "channelDeleted"
                },
                Name = "2",
                ChannelId = "directline"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                ChannelData = new TeamsChannelData
                {
                    EventType = "teamRenamed"
                },
                ChannelId = "directline"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Text = "hello a"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "welcome"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Text = "hello b"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Text = "hello"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "welcome"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Text = "hello"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Text = "hello"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Name = "hello"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "welcome"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message,
                Text = "hello world"
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
            });
            var texts = new List<string>();
            app.OnMessage(new MultipleRouteSelector
            {
                Strings = new[] { "world" },
                Regexes = new[] { new Regex("come") },
                RouteSelectors = new RouteSelector[] { (context, _) => Task.FromResult(context.Activity?.Name != null) },
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
                Name = "1"
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
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Name = "1"
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
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Name = "1"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelId = Channels.Msteams,
                ChannelData = new TeamsChannelData
                {
                    EventType = "unknown"
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
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageReaction
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.MessageReaction
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message
            };

            var adapter = new NotImplementedAdapter();
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Name = "config/fetch"
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/submit"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var configResponseMock = new Mock<ConfigResponseBase>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = configResponseMock.Object
            };
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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
                Value = JObject.FromObject(data)
            };
            var activity2 = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = "config/fetch"
            };
            var activity3 = new Activity
            {
                Type = ActivityTypes.Message
            };
            var turnContext1 = new TurnContext(adapter, activity1);
            var turnContext2 = new TurnContext(adapter, activity2);
            var turnContext3 = new TurnContext(adapter, activity3);
            var configResponseMock = new Mock<ConfigResponseBase>();
            var expectedInvokeResponse = new InvokeResponse()
            {
                Status = 200,
                Body = configResponseMock.Object
            };
            var app = new Application<TestTurnState, TestTurnStateManager>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false
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

            // Assert
            Assert.Single(names);
            Assert.Equal("config/submit", names[0]);
            Assert.NotNull(activitiesToSend);
            Assert.Equal(1, activitiesToSend.Length);
            Assert.Equal("invokeResponse", activitiesToSend[0].Type);
            Assert.Equivalent(expectedInvokeResponse, activitiesToSend[0].Value);
        }
    }
}
