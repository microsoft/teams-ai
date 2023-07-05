// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Connector;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Moq;
using Newtonsoft.Json.Linq;
using Microsoft.Bot.Builder.M365.Tests.TestUtils;
using Microsoft.Bot.Schema.Teams;
using Microsoft.Rest.Serialization;
using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;

namespace Microsoft.Bot.Builder.M365.Tests.ActivityHandlerTests
{
    public class ActivityHandlerTests
    {
        [Fact]
        public async Task Test_MessageActivity()
        {
            // Arrange
            var activity = MessageFactory.Text("hello");
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_MessageEdit()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelData = new TeamsChannelData { EventType = "editMessage" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessageEditAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_MessageUndelete()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelData = new TeamsChannelData { EventType = "undeleteMessage" },
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessageUndeleteAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_MessageUndelete_NoMsteams()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelData = new TeamsChannelData { EventType = "undeleteMessage" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageUpdateActivity_NoChannelData()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageUpdate,
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageDelete };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity_MessageSoftDelete()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelData = new TeamsChannelData { EventType = "softDeleteMessage" },
                ChannelId = Channels.Msteams
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
            Assert.Equal("OnMessageSoftDeleteAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity_MessageSoftDelete_NoMsteams()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelData = new TeamsChannelData { EventType = "softMessage" }
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_MessageDeleteActivity_NoChannelData()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageDelete,
                ChannelId = Channels.Msteams,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageDeleteActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_EndOfConversationActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.EndOfConversation, Value = "some value" };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnEndOfConversationActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_TypingActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.Typing };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnTypingActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.InstallationUpdate };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_AddAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "add"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateAddAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_AddUpgradeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "add-upgrade"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateAddAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_RemoveAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "remove"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateRemoveAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_InstallationUpdateActivity_RemoveUpgradeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.InstallationUpdate,
                Action = "remove-upgrade"
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateRemoveAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_MessageReactionActivity_ReactionAdded_And_ReactionRemoved()
        {
            // Note the code supports multiple adds and removes in the same activity though
            // a channel may decide to send separate activities for each. For example, Teams
            // sends separate activities each with a single add and a single remove.

            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.MessageReaction,
                ReactionsAdded = new List<MessageReaction>
                {
                    new MessageReaction("sad"),
                },
                ReactionsRemoved = new List<MessageReaction>
                {
                    new MessageReaction("angry"),
                },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnMessageReactionActivityAsync", bot.Record[0]);
            Assert.Equal("OnReactionsAddedAsync", bot.Record[1]);
            Assert.Equal("OnReactionsRemovedAsync", bot.Record[2]);
        }

        [Fact]
        public async Task Test_EventActivity()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Directline,
                Type = ActivityTypes.Event
            };

            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_EventActivity_TokenResponseEventAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
                Name = SignInConstants.TokenResponseEventName,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnTokenResponseEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_EventActvitiy_EventAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
                Name = "some.random.event",
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_EventActivity_MeetingStartEvent()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Msteams,
                Type = ActivityTypes.Event,
                Name = "application/vnd.microsoft.meetingStart",
                Value = JObject.Parse(@"{""StartTime"":""2021-06-05T00:01:02.0Z""}"),
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
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnMeetingStartAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.Contains("12:01:02 AM", activitiesToSend[0].Text); // Date format differs between OSs, so we just Assert.Contains instead of Assert.Equals
        }

        [Fact]
        public async Task Test_EventActivity_MeetingEndEvent()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Msteams,
                Type = ActivityTypes.Event,
                Name = "application/vnd.microsoft.meetingEnd",
                Value = JObject.Parse(@"{""EndTime"":""2021-06-05T01:02:03.0Z""}"),
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
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnMeetingEndAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.Contains("1:02:03 AM", activitiesToSend[0].Text); // Date format differs between OSs, so we just Assert.Contains instead of Assert.Equals
        }

        [Fact]
        public async Task Test_EventActivity_ReadReceiptEvent()
        {
            // Arrange
            var activity = new Activity
            {
                ChannelId = Channels.Msteams,
                Type = ActivityTypes.Event,
                Name = "application/vnd.microsoft.readReceipt",
                Value = JObject.Parse(@"{""lastReadMessageId"":""10101010""}"),
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
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnReadReceiptAsync", bot.Record[1]);
            Assert.NotNull(activitiesToSend);
            Assert.Single(activitiesToSend);
            Assert.Equal("10101010", activitiesToSend[0].Text);
        }

        [Fact]
        public async Task Test_EventActivity_EventNullNameAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Event,
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_CommandActivityType()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Command,
                Name = "application/test",
                Value = new CommandValue<object> { CommandId = "Test", Data = new { test = true } }
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnCommandActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_CommandResultActivityType()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.CommandResult,
                Name = "application/test",
                Value = new CommandResultValue<object> { CommandId = "Test", Data = new { test = true } }
            };

            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnCommandResultActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_UnrecognizedActivityType()
        {
            // Arrange
            var activity = new Activity
            {
                Type = "shall.not.pass",
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>());
            var isHandlerImplemented = await bot.RunActivityHandlerAsync(turnContext, turnState, default);

            // Assert
            Assert.False(isHandlerImplemented);
            Assert.Single(bot.Record);
            Assert.Equal("OnUnrecognizedActivityTypeAsync", bot.Record[0]);
        }

        [Fact]
        public async Task TestDelegatingTurnContext()
        {
            // Arrange
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup(tc => tc.Activity).Returns(new Activity { Type = ActivityTypes.Message });
            turnContextMock.Setup(tc => tc.Adapter).Returns(new BotFrameworkAdapter(new SimpleCredentialProvider()));
            turnContextMock.Setup(tc => tc.TurnState).Returns(new TurnContextStateCollection());
            turnContextMock.Setup(tc => tc.Responded).Returns(false);
            turnContextMock.Setup(tc => tc.OnDeleteActivity(It.IsAny<DeleteActivityHandler>()));
            turnContextMock.Setup(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()));
            turnContextMock.Setup(tc => tc.OnUpdateActivity(It.IsAny<UpdateActivityHandler>()));
            turnContextMock.Setup(tc => tc.SendActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new ResourceResponse()));
            turnContextMock.Setup(tc => tc.SendActivitiesAsync(It.IsAny<IActivity[]>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new[] { new ResourceResponse() }));
            turnContextMock.Setup(tc => tc.DeleteActivityAsync(It.IsAny<ConversationReference>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new ResourceResponse()));
            turnContextMock.Setup(tc => tc.UpdateActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>())).Returns(Task.FromResult(new ResourceResponse()));
            var turnState = new TurnState();

            // Act
            var bot = new TestDelegatingTurnContext(new ApplicationOptions<TurnState>());
            await bot.RunActivityHandlerAsync(turnContextMock.Object, turnState, default);

            // Assert
            turnContextMock.VerifyGet(tc => tc.Activity, Times.AtLeastOnce);
            turnContextMock.VerifyGet(tc => tc.Adapter, Times.Once);
            turnContextMock.VerifyGet(tc => tc.TurnState, Times.Once);
            turnContextMock.VerifyGet(tc => tc.Responded, Times.Once);
            turnContextMock.Verify(tc => tc.OnDeleteActivity(It.IsAny<DeleteActivityHandler>()), Times.Once);
            turnContextMock.Verify(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()), Times.Once);
            turnContextMock.Verify(tc => tc.OnUpdateActivity(It.IsAny<UpdateActivityHandler>()), Times.Once);
            turnContextMock.Verify(tc => tc.SendActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>()), Times.Once);
            turnContextMock.Verify(tc => tc.SendActivitiesAsync(It.IsAny<IActivity[]>(), It.IsAny<CancellationToken>()), Times.Once);
            turnContextMock.Verify(tc => tc.DeleteActivityAsync(It.IsAny<ConversationReference>(), It.IsAny<CancellationToken>()), Times.Once);
            turnContextMock.Verify(tc => tc.UpdateActivityAsync(It.IsAny<IActivity>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_OnTurnAsync_Disable_LongRunningMessages()
        {
            // Arrange
            var activity = MessageFactory.Text("hello");
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>
            {
                LongRunningMessages = false,
                StartTypingTimer = false,
                RemoveRecipientMention = false
            });
            await bot.OnTurnAsync(turnContext, default);

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageActivityAsync", bot.Record[0]);
        }

        [Fact]
        public void Test_OnTurnAsync_Enable_LongRunningMessages_Without_Adapter_ShouldThrow()
        {
            // Arrange
            var activity = MessageFactory.Text("hello");
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);

            // Act
            var exception = Assert.Throws<Exception>(() => new TestActivityHandler(new ApplicationOptions<TurnState>
            {
                LongRunningMessages = true,
                StartTypingTimer = false,
                RemoveRecipientMention = false
            }));

            // Assert
            Assert.NotNull(exception);
            Assert.Equal("The ApplicationOptions.LongRunningMessages property is unavailable because no adapter or botAppId was configured.", exception.Message);
        }

        [Fact]
        public async Task Test_OnTurnAsync_Enable_LongRunningMessages_Message_Activity()
        {
            // Arrange
            var activity = MessageFactory.Text("hello");
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var adapterMock = new Mock<BotAdapter>();
            adapterMock.Setup(adapter => adapter.ContinueConversationAsync(It.IsAny<string>(), It.IsAny<Activity>(), It.IsAny<BotCallbackHandler>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>
            {
                Adapter = adapterMock.Object,
                BotAppId = "test-bot-app-id",
                LongRunningMessages = true,
                StartTypingTimer = false,
                RemoveRecipientMention = false,
            });
            await bot.OnTurnAsync(turnContext, default);

            // Assert
            adapterMock.Verify(adapter => adapter.ContinueConversationAsync(It.IsAny<string>(), It.IsAny<Activity>(), It.IsAny<BotCallbackHandler>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task Test_OnTurnAsync_Enable_LongRunningMessages_NonMessage_Activity()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var adapterMock = new Mock<BotAdapter>();
            adapterMock.Setup(adapter => adapter.ContinueConversationAsync(It.IsAny<string>(), It.IsAny<Activity>(), It.IsAny<BotCallbackHandler>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

            // Act
            var bot = new TestActivityHandler(new ApplicationOptions<TurnState>
            {
                Adapter = adapterMock.Object,
                BotAppId = "test-bot-app-id",
                LongRunningMessages = true,
                StartTypingTimer = false,
                RemoveRecipientMention = false,
            });
            await bot.OnTurnAsync(turnContext, default);

            // Assert
            adapterMock.Verify(adapter => adapter.ContinueConversationAsync(It.IsAny<string>(), It.IsAny<Activity>(), It.IsAny<BotCallbackHandler>(), It.IsAny<CancellationToken>()), Times.Never);
            Assert.Single(bot.Record);
            Assert.Equal("OnMessageUpdateActivityAsync", bot.Record[0]);
        }
    }
}
