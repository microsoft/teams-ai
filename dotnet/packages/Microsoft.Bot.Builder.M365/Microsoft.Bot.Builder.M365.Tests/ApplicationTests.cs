// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.Bot.Connector;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Bot.Schema;
using Moq;
using Newtonsoft.Json.Linq;
using Microsoft.Bot.Builder.M365.Tests.TestUtils;

namespace Microsoft.Bot.Builder.M365.Tests
{
    public class ApplicationTests
    {
        [Fact]
        public async Task Test_MessageActivity()
        {
            // Arrange
            var activity = MessageFactory.Text("hello");
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_One_MemberAdded()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "b" },
                },
                Recipient = new ChannelAccount { Id = "b" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Two_MembersAdded()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "a" },
                    new ChannelAccount { Id = "b" },
                },
                Recipient = new ChannelAccount { Id = "b" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersAddedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_One_MemberRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "c" },
                },
                Recipient = new ChannelAccount { Id = "c" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Two_MembersRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "a" },
                    new ChannelAccount { Id = "c" },
                },
                Recipient = new ChannelAccount { Id = "c" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnMembersRemovedAsync", bot.Record[1]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Bot_MemberAdded()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersAdded = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "b" },
                },
                Recipient = new ChannelAccount { Id = "b" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
        }

        [Fact]
        public async Task Test_ConversationUpdateActivity_Bot_MemberRemoved()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.ConversationUpdate,
                MembersRemoved = new List<ChannelAccount>
                {
                    new ChannelAccount { Id = "c" },
                },
                Recipient = new ChannelAccount { Id = "c" },
            };
            var turnContext = new TurnContext(new NotImplementedAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnConversationUpdateActivityAsync", bot.Record[0]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(3, bot.Record.Count);
            Assert.Equal("OnMessageReactionActivityAsync", bot.Record[0]);
            Assert.Equal("OnReactionsAddedAsync", bot.Record[1]);
            Assert.Equal("OnReactionsRemovedAsync", bot.Record[2]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
        }

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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal(200, ((InvokeResponse)((Activity)adapter.Activity).Value).Status);
        }

        [Fact]
        public async Task Test_InvokeActivity_SignInInvokeAsync()
        {
            // Arrange
            var activity = new Activity
            {
                Type = ActivityTypes.Invoke,
                Name = SignInConstants.VerifyStateOperationName,
            };
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSignInInvokeAsync", bot.Record[1]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Single(bot.Record);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal(501, ((InvokeResponse)((Activity)adapter.Activity).Value).Status);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnEventActivityAsync", bot.Record[0]);
            Assert.Equal("OnEventAsync", bot.Record[1]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInstallationUpdateActivityAsync", bot.Record[0]);
            Assert.Equal("OnInstallationUpdateRemoveAsync", bot.Record[1]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnAdaptiveCardActionExecuteAsync", bot.Record[1]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            await bot.RunAsync(turnContextMock.Object, turnState, default);

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
        public async Task Test_InvokeActivity_OnSearchInvokeAsync()
        {
            // Arrange
            var value = JObject.FromObject(new SearchInvokeValue { Kind = SearchInvokeTypes.Search, QueryText = "bot" });
            var activity = GetSearchActivity(value);
            var turnContext = new TurnContext(new TestInvokeAdapter(), activity);
            var turnState = new TurnState();

            // Act
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
            Assert.Equal(2, bot.Record.Count);
            Assert.Equal("OnInvokeActivityAsync", bot.Record[0]);
            Assert.Equal("OnSearchInvokeAsync", bot.Record[1]);
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

            // Assert
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
            var bot = new TestRunActivityHandler(new ApplicationOptions<TurnState>());
            await bot.RunAsync(turnContext, turnState, default(CancellationToken));

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
