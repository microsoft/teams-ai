using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Bot.Schema;
using Moq;
using Microsoft.Bot.Builder;
using Record = Microsoft.Teams.AI.State.Record;
using System.Reflection;

namespace Microsoft.Teams.AI.Tests.StateTests
{
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
                IDictionary<string, object> items = new Dictionary<string, object>
                {
                    [conversationKey] = conversationState,
                    [userKey] = userState
                };
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

        [Fact]
        public async void Test_SaveState_Existing_Loading_Operation()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // set _loadingTask
            var _loadingTaskProperty = typeof(TurnState).GetField("_loadingTask", BindingFlags.NonPublic | BindingFlags.Instance);
            var waitedForTaskToComplete = false;
            var task = Task.Run(() =>
            {
                Thread.Sleep(50);
                waitedForTaskToComplete = true;
                return true;
            });
            _loadingTaskProperty?.SetValue(state, task);

            // Act
            try
            {
                await state.SaveStateAsync(turnContext, null);
            }
#pragma warning disable CA1031
            catch (Exception)
            {
#pragma warning restore CA1031
                // Ignore the exception, this is the expected behavior is state is not loaded.
            }

            // Assert
            Assert.Equal(true, waitedForTaskToComplete);
            Assert.True(task.IsCompleted);
        }

        [Fact]
        public async void Test_SaveState_IsLoaded()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentNullException>(async () => await state.SaveStateAsync(turnContext, null));
            Assert.True(exception.Message.Contains("TurnState hasn't been loaded."));
        }

        [Fact]
        public async void Test_SaveState_Does_Not_Save_TempScope()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var storage = new MemoryStorage();
            await state.LoadStateAsync(storage, turnContext);
            state.Temp["test"] = "test";

            // Act
            await state.SaveStateAsync(turnContext, storage);

            // Assert
            var items = await storage.ReadAsync(new string[] { "temp" }, default);
            Assert.False(items.ContainsKey("temp"));
        }

        [Fact]
        public async void Test_SaveState_Conversation_State()
        {
            // Arrange
            var state = new CustomTurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var storage = new MemoryStorage();
            await state.LoadStateAsync(storage, turnContext);
            state.Conversation["test"] = "test";
            var storage_keys = state.GetStorageKeys(turnContext);
            var conversationStorageKey = storage_keys["conversation"];

            // Act
            await state.SaveStateAsync(turnContext, storage);

            // Assert
            var items = await storage.ReadAsync(new string[] { conversationStorageKey }, default);
            Assert.True(items.ContainsKey(conversationStorageKey));

            Record? conversationRecord = items[conversationStorageKey] as Record;
            Assert.NotNull(conversationRecord);
            Assert.Equal("test", conversationRecord["test"]);
        }

        [Fact]
        public async void Test_SaveState_User_State()
        {
            // Arrange
            var state = new CustomTurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var storage = new MemoryStorage();
            await state.LoadStateAsync(storage, turnContext);
            state.User["test"] = "test";
            var storage_keys = state.GetStorageKeys(turnContext);
            var userStorageKey = storage_keys["user"];

            // Act
            await state.SaveStateAsync(turnContext, storage);

            // Assert
            var items = await storage.ReadAsync(new string[] { userStorageKey }, default);
            Assert.True(items.ContainsKey(userStorageKey));

            Record? userRecord = items[userStorageKey] as Record;
            Assert.NotNull(userRecord);
            Assert.Equal("test", userRecord["test"]);
        }

        [Fact]
        public async void Test_SaveState_Entry_Deleted()
        {
            // Arrange
            var state = new CustomTurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            var storage = new MemoryStorage();
            await state.LoadStateAsync(storage, turnContext);
            state.User["test"] = "test";
            var storage_keys = state.GetStorageKeys(turnContext);
            var userStorageKey = storage_keys["user"];
            state.DeleteUserState();

            // Act
            await state.SaveStateAsync(turnContext, storage);

            // Assert
            var items = await storage.ReadAsync(new string[] { userStorageKey }, default);
            Assert.False(items.ContainsKey(userStorageKey));
        }


        [Fact]
        public async void Test_SetValue()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            state.SetValue("temp.key", "temp_test");
            state.SetValue("conversation.key", "conversation_test");
            state.SetValue("user.key", "user_test");

            // Assert
            Assert.Equal("temp_test", state.Temp["key"]);
            Assert.Equal("conversation_test", state.Conversation["key"]);
            Assert.Equal("user_test", state.User["key"]);
        }

        [Fact]
        public async void Test_SetValue_InvalidScope()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act & Assert
            var exception = Assert.Throws<ArgumentNullException>(() => state.SetValue("invalidScope.key", ""));
            Assert.Contains("Invalid state scope: invalidScope", exception.Message);
        }

        [Fact]
        public async void Test_SetValue_InvalidPath()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.SetValue("invalid.path.path", ""));
            Assert.Contains("Invalid state path: invalid.path.path", exception.Message);
        }

        [Fact]
        public async void Test_GetValue()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            state.Temp["key"] = "temp_test";
            state.Conversation["key"] = "conversation_test";
            state.User["key"] = "user_test";

            // Assert
            Assert.Equal("temp_test", state.GetValue("temp.key"));
            Assert.Equal("conversation_test", state.GetValue("conversation.key"));
            Assert.Equal("user_test", state.GetValue("user.key"));
        }

        [Fact]
        public async void Test_HasValue_Returns_True()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);
            state.Temp["key"] = "temp_test";

            // Act
            bool hasValue = state.HasValue("temp.key");

            // Assert
            Assert.True(hasValue);
        }

        [Fact]
        public async void Test_HasValue_Returns_False()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);
            var invalidPath = "temp.key"; // `temp` is a valid scope, `key` is not a valid key

            // Act
            bool hasValue = state.HasValue(invalidPath);

            // Assert
            Assert.False(hasValue);
        }

        [Fact]
        public async void Test_DeleteValue()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);
            state.SetValue("temp.key", "temp_test");

            // Act
            state.DeleteValue("temp.key");

            // Assert
            Assert.False(state.HasValue("temp.key"));
        }

        [Fact]
        public async void Test_DeleteTempState()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);
            state.SetValue("temp.key", "temp_test");

            // Act
            state.DeleteTempState();

            // Assert
            Assert.False(state.HasValue("temp.key"));
        }

        [Fact]
        public void Test_DeleteTempState_Invalid_Scope()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.DeleteTempState());
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public async void Test_DeleteUserState()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);
            state.SetValue("user.key", "user_test");

            // Act
            state.DeleteUserState();

            // Assert
            Assert.False(state.HasValue("user.key"));
        }

        [Fact]
        public void Test_DeleteUserState_Invalid_Scope()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.DeleteUserState());
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public async void Test_DeleteConversationState()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);
            state.SetValue("conversation.key", "conversation_test");

            // Act
            state.DeleteConversationState();

            // Assert
            Assert.False(state.HasValue("conversation.key"));
        }

        [Fact]
        public void Test_DeleteConversationState_Invalid_Scope()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.DeleteConversationState());
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public void Test_GetScope_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();

            // Act
            var scope = state.GetScope("temp");

            // Assert
            Assert.Null(scope);
        }

        [Fact]
        public async void Test_GetScope_After_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            var scope = state.GetScope("temp");

            // Assert
            Assert.NotNull(scope);
        }

        [Fact]
        public void Test_Conversation_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.Conversation);
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public void Test_User_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.User);
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public void Test_Temp_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.Temp);
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public async void Test_Conversation()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            var record = state.Conversation;

            // Assert
            Assert.NotNull(record);
        }

        [Fact]
        public async void Test_Temp()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            var record = state.Temp;

            // Assert
            Assert.NotNull(record);
        }

        [Fact]
        public async void Test_User()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            var record = state.User;

            // Assert
            Assert.NotNull(record);
        }

        [Fact]
        public void Test_Set_Conversation_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.Conversation = new Record());
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public void Test_Set_User_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.User = new Record());
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public void Test_Set_Temp_Before_Loading_State()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => state.Temp = new TempState());
            Assert.Contains("TurnState hasn't been loaded. Call LoadStateAsync() first.", exception.Message);
        }

        [Fact]
        public async void Test_Set_Conversation()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            state.Conversation["test"] = "value";

            // Assert
            Assert.Equal("value", state.Conversation["test"]);
        }

        [Fact]
        public async void Test_Set_Temp()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            state.Temp["test"] = "value";

            // Assert
            Assert.Equal("value", state.Temp["test"]);
        }

        [Fact]
        public async void Test_Set_User()
        {
            // Arrange
            var state = new TurnState();
            var turnContext = TurnStateConfig.CreateConfiguredTurnContext();
            await state.LoadStateAsync(null, turnContext);

            // Act
            state.User["test"] = "value";

            // Assert
            Assert.Equal("value", state.User["test"]);
        }

        [Fact]
        public void Test_IsLoaded()
        {
            // Arrange
            var state = new TurnState();

            // Act
            var isLoaded = state.IsLoaded();

            // Assert
            Assert.False(isLoaded);
        }
    }
}
