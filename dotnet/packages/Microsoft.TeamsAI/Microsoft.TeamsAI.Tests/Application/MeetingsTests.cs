using Microsoft.Bot.Builder;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class MeetingsTests
    {
        [Fact]
        public async void Test_OnStart()
        {
            // Arrange
            var adapter = new NotImplementedAdapter();
            var turnContexts = CreateMeetingTurnContext("application/vnd.microsoft.meetingStart", adapter);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContexts[0]);

            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.Meetings.OnStart((context, _, _, _) =>
            {
                ids.Add(context.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            foreach (var turnContext in turnContexts)
            {
                await app.OnTurnAsync(turnContext);
            }

            // Assert
            Assert.Single(ids);
            Assert.Equal("test.id", ids[0]);
        }

        [Fact]
        public async void Test_OnEnd()
        {
            // Arrange
            var adapter = new NotImplementedAdapter();
            var turnContexts = CreateMeetingTurnContext("application/vnd.microsoft.meetingEnd", adapter);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContexts[0]);

            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.Meetings.OnEnd((context, _, _, _) =>
            {
                ids.Add(context.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            foreach (var turnContext in turnContexts)
            {
                await app.OnTurnAsync(turnContext);
            }

            // Assert
            Assert.Single(ids);
            Assert.Equal("test.id", ids[0]);
        }

        [Fact]
        public async void Test_OnParticipantsJoin()
        {
            // Arrange
            var adapter = new NotImplementedAdapter();
            var turnContexts = CreateMeetingTurnContext("application/vnd.microsoft.meetingParticipantJoin", adapter);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContexts[0]);

            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.Meetings.OnParticipantsJoin((context, _, _, _) =>
            {
                ids.Add(context.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            foreach (var turnContext in turnContexts)
            {
                await app.OnTurnAsync(turnContext);
            }

            // Assert
            Assert.Single(ids);
            Assert.Equal("test.id", ids[0]);
        }

        [Fact]
        public async void Test_OnParticipantsLeave()
        {
            // Arrange
            var adapter = new NotImplementedAdapter();
            var turnContexts = CreateMeetingTurnContext("application/vnd.microsoft.meetingParticipantLeave", adapter);
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContexts[0]);

            var app = new Application<TurnState<Record, Record, TempState>>(new()
            {
                RemoveRecipientMention = false,
                StartTypingTimer = false,
                TurnStateFactory = () => turnState.Result,
            });
            var ids = new List<string>();
            app.Meetings.OnParticipantsLeave((context, _, _, _) =>
            {
                ids.Add(context.Activity.Id);
                return Task.CompletedTask;
            });

            // Act
            foreach (var turnContext in turnContexts)
            {
                await app.OnTurnAsync(turnContext);
            }

            // Assert
            Assert.Single(ids);
            Assert.Equal("test.id", ids[0]);
        }

        private static TurnContext[] CreateMeetingTurnContext(string activityName, BotAdapter adapter)
        {
            return new TurnContext[]
            {
                new(adapter, new Activity
                {
                    Type = ActivityTypes.Event,
                    ChannelId = Channels.Msteams,
                    Name = activityName,
                    Id = "test.id",
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From =  new() { Id = "fromId" },
                }),
                new(adapter, new Activity
                {
                    Type = ActivityTypes.Event,
                    ChannelId = Channels.Msteams,
                    Name = "fake.name",
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From =  new() { Id = "fromId" },
                }),
                new(adapter, new Activity
                {
                    Type = ActivityTypes.Invoke,
                    ChannelId = Channels.Msteams,
                    Name = activityName,
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From =  new() { Id = "fromId" },
                }),
                new(adapter, new Activity
                {
                    Type = ActivityTypes.Event,
                    ChannelId = Channels.Webchat,
                    Name = activityName,
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From =  new() { Id = "fromId" },
                }),
            };
        }
    }
}
