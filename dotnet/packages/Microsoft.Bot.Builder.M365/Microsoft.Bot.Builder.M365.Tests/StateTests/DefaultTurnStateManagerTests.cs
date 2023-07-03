
using Microsoft.Bot.Builder.M365.State;
using Microsoft.Bot.Builder.M365.Tests.TestUtils;
using Microsoft.Bot.Builder.M365.Utilities;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Schema;
using Moq;
using Xunit.Abstractions;

namespace Microsoft.Bot.Builder.M365.Tests.StateTests
{
    public class DefaultTurnStateManagerTests
    {
        [Fact]
        public void Test_LoadState_MissingRequiredTurnContextProperties_ShouldFail()
        {
            // a combination for each property required
        }

        [Fact]
        public async void Test_LoadState_NoStorageProvided_ShouldInitializeEmptyConstructor()
        {
            // Arrange
            var turnStateManager = new DefaultTurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
            var turnContext = _createConfiguredTurnContext();
            IStorage storage = null;
            
            // Act
            ApplicationTurnState state = await turnStateManager.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.NotNull(state);
            Assert.NotNull(state.ConversationState);
            Assert.NotNull(state.UserState);
            Assert.NotNull(state.TempState);

            Assert.Equal(state.ConversationState.Value, new ConversationState());
        }

        [Fact]
        public async void Test_LoadState_StorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var turnStateManager = new DefaultTurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
            var turnContext = _createConfiguredTurnContext();
            Activity activity = turnContext.Activity;
            string channelId = activity.ChannelId;
            string botId = activity.Recipient.Id;
            string conversationId = activity.Conversation.Id;
            string userId = activity.From.Id;

            string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
            string userKey = $"{channelId}/${botId}/users/${userId}";

            var conversationState = new ConversationState();
            var userState = new UserState();

            Mock<IStorage> storage = new();
            storage.Setup(storage => storage.ReadAsync(new string[] { conversationKey, userKey }, It.IsAny<CancellationToken>())).Returns(() =>
            {
                IDictionary<string, object> items = new Dictionary<string, object>();
                items[conversationKey] = conversationState;
                items[userKey] = userState;
                return Task.FromResult(items);
            });

            // Act
            ApplicationTurnState state = await turnStateManager.LoadStateAsync(storage.Object, turnContext);

            // Assert
            storage.Verify(storage => storage.ReadAsync(new string[] { conversationKey, userKey }, It.IsAny<CancellationToken>()));
            Assert.NotNull(state);
            Assert.Equal(state.ConversationState?.Value, conversationState);
            Assert.Equal(state.UserState?.Value, userState);
            Assert.NotNull(state.TempState);
        }

        private TurnContext _createConfiguredTurnContext()
        {
            return new TurnContext(new NotImplementedAdapter(), new Activity(
                channelId: "channelId",
                recipient: new(){ Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
        }

        private class ConversationState : Dictionary<string, object> { }
        private class UserState : Dictionary<string, object> { }

        private class ApplicationTurnState : DefaultTurnState<ConversationState, UserState, TempState> { }
    }
}
