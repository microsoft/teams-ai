
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Bot.Schema;
using Moq;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.Tests.StateTests
{
    /// <summary>
    /// TODO: Add tests that enforce required properties. Ex. If a required param/object is null, should throw exception.
    /// </summary>
    public class TurnStateManagerTests
    {
        [Fact]
        public async void Test_LoadState_NoStorageProvided_ShouldInitializeEmptyConstructor()
        {
            // Arrange
            var turnStateManager = new TurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
            var turnContext = _createConfiguredTurnContext();
            IStorage? storage = null;

            // Act
            ApplicationTurnState state = await turnStateManager.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.NotNull(state);
            Assert.NotNull(state.Conversation);
            Assert.NotNull(state.User);
            Assert.NotNull(state.Temp);

            Assert.Equal(state.ConversationStateEntry!.Value, new ConversationState());
        }

        [Fact]
        public async void Test_LoadState_MockStorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var turnStateManager = new TurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
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
            Assert.Equal(state.Conversation, conversationState);
            Assert.Equal(state.User, userState);
            Assert.NotNull(state.Temp);
        }

        [Fact]
        public async void Test_LoadState_MemoryStorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var turnStateManager = new TurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
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

            IStorage storage = new MemoryStorage();
            IDictionary<string, object> items = new Dictionary<string, object>
            {
                [conversationKey] = conversationState,
                [userKey] = userState
            };
            await storage.WriteAsync(items);

            // Act
            ApplicationTurnState state = await turnStateManager.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.NotNull(state);
            Assert.Equal(state.ConversationStateEntry?.Value, conversationState);
            Assert.Equal(state.UserStateEntry?.Value, userState);
            Assert.NotNull(state.TempStateEntry);
        }

        [Fact]
        public async void Test_SaveState_SavesChanges()
        {
            // Arrange
            var turnStateManager = new TurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
            var turnContext = _createConfiguredTurnContext();

            var storageKey = "storageKey";
            var stateValue = new ConversationState();
            ApplicationTurnState state = new()
            {
                ConversationStateEntry = new TurnStateEntry<ConversationState>(stateValue, storageKey)
            };

            var storage = new MemoryStorage();
            var stateValueKey = "stateValueKey";

            // Act
            /// Mutate the conversation state to so that the changes are saved.
            stateValue[stateValueKey] = "arbitaryString";
            /// Save the state
            await turnStateManager.SaveStateAsync(storage, turnContext, state);
            /// Load from storage
            IDictionary<string, object> storedItems = await storage.ReadAsync(new string[] { storageKey }, default);

            // Assert
            Assert.NotNull(storedItems);
            Assert.Equal(state.ConversationStateEntry.Value, storedItems[storageKey]);
        }

        [Fact]
        public async void Test_SaveState_DeletesChanges()
        {
            // Arrange
            var turnStateManager = new TurnStateManager<ApplicationTurnState, ConversationState, UserState, TempState>();
            var turnContext = _createConfiguredTurnContext();

            var storageKey = "storageKey";
            var stateValue = new ConversationState();
            ApplicationTurnState state = new()
            {
                ConversationStateEntry = new TurnStateEntry<ConversationState>(stateValue, storageKey)
            };

            var storage = new MemoryStorage();

            // Act
            /// Mutate the conversation state to so that the changes are saved.
            state.Conversation!.Set("test", "test");
            /// Save the state first
            await turnStateManager.SaveStateAsync(storage, turnContext, state);
            /// Delete conversation state
            state.ConversationStateEntry.Delete();
            /// Save the state again
            await turnStateManager.SaveStateAsync(storage, turnContext, state);
            /// Load from storage
            IDictionary<string, object> storedItems = await storage.ReadAsync(new string[] { storageKey }, default);

            // Assert
            Assert.NotNull(storedItems);
            Assert.Empty(storedItems.Keys);
        }

        private static TurnContext _createConfiguredTurnContext()
        {
            return new TurnContext(new NotImplementedAdapter(), new Activity(
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
        }

        private sealed class ConversationState : StateBase { }
        private sealed class UserState : StateBase { }

        private sealed class ApplicationTurnState : TurnState<ConversationState, UserState, TempState> { }
    }
}
