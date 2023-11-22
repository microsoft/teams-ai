using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Bot.Schema;
using Moq;
using Microsoft.Bot.Builder;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.StateTests
{
    /// <summary>
    /// TODO: Add tests that enforce required properties. Ex. If a required param/object is null, should throw exception.
    /// TODO: Add tests for save state
    /// TODO: Add tests for each public method
    /// </summary>
    public class TurnStateTests
    {
        [Fact]
        public async void Test_LoadState_NoStorageProvided_ShouldCreateDefaultTurnState()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            IStorage? storage = null;

            // Act
            bool loadResult = await state.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.True(loadResult);
            Assert.NotNull(state.Temp);
            Assert.NotNull(state.Conversation);
            Assert.NotNull(state.User);
        }

        [Fact]
        public async void Test_LoadState_MockStorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            Activity activity = turnContext.Activity;
            string channelId = activity.ChannelId;
            string botId = activity.Recipient.Id;
            string conversationId = activity.Conversation.Id;
            string userId = activity.From.Id;

            string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
            string userKey = $"{channelId}/${botId}/users/${userId}";

            var conversationState = new Record();
            var userState = new Record();

            Mock<IStorage> storage = new();
            storage.Setup(storage => storage.ReadAsync(new string[] { conversationKey, userKey }, It.IsAny<CancellationToken>())).Returns(() =>
            {
                IDictionary<string, object> items = new Dictionary<string, object>();
                items[conversationKey] = conversationState;
                items[userKey] = userState;
                return Task.FromResult(items);
            });

            // Act
            bool loadResult = await state.LoadStateAsync(storage.Object, turnContext);

            // Assert
            storage.Verify(storage => storage.ReadAsync(new string[] { conversationKey, userKey }, It.IsAny<CancellationToken>()));
            Assert.True(loadResult);
            Assert.NotNull(state);
            Assert.Equal(state.Conversation, conversationState);
            Assert.Equal(state.User, userState);
            Assert.NotNull(state.Temp);
        }

        [Fact]
        public async void Test_LoadState_MemoryStorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            Activity activity = turnContext.Activity;
            string channelId = activity.ChannelId;
            string botId = activity.Recipient.Id;
            string conversationId = activity.Conversation.Id;
            string userId = activity.From.Id;

            string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
            string userKey = $"{channelId}/${botId}/users/${userId}";

            var conversationState = new Record();
            var userState = new Record();

            IStorage storage = new MemoryStorage();
            IDictionary<string, object> items = new Dictionary<string, object>
            {
                [conversationKey] = conversationState,
                [userKey] = userState
            };
            await storage.WriteAsync(items);

            // Act
            bool loadResult = await state.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.True(loadResult);
            Assert.NotNull(state);
            Assert.Equal(state.Conversation, conversationState);
            Assert.Equal(state.User, userState);
            Assert.NotNull(state.Temp);
        }

        [Fact]
        public async void Test_LoadState_CustomTurnState_MemoryStorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var state = new CustomTurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            Activity activity = turnContext.Activity;
            string channelId = activity.ChannelId;
            string botId = activity.Recipient.Id;
            string conversationId = activity.Conversation.Id;
            string userId = activity.From.Id;

            string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
            string userKey = $"{channelId}/${botId}/users/${userId}";

            var conversationState = new TestUtils.ConversationState();
            var userState = new Record();

            IStorage storage = new MemoryStorage();
            IDictionary<string, object> items = new Dictionary<string, object>
            {
                [conversationKey] = conversationState,
                [userKey] = userState
            };
            await storage.WriteAsync(items);

            // Act
            bool loadResult = await state.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.True(loadResult);
            Assert.NotNull(state);
            Assert.Equal(state.Conversation, conversationState);
            Assert.Equal(state.User, userState);
            Assert.NotNull(state.Temp);
        }

        [Fact]
        public async void Test_LoadState_CustomTurnState_EmptyMemoryStorageProvided_ShouldPopulateTurnState()
        {
            // Arrange
            var state = new CustomTurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            IStorage storage = new MemoryStorage();

            // Act
            bool loadResult = await state.LoadStateAsync(storage, turnContext);

            // Assert
            Assert.True(loadResult);
            Assert.NotNull(state.Conversation);
            Assert.NotNull(state.Temp);
            Assert.NotNull(state.User);
        }
    }
}
