using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Utilities;
using Moq;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public static class TurnStateConfig
    {
        public static async Task<TurnState<Record, Record, TempState>> GetTurnStateWithConversationStateAsync(TurnContext turnContext)
        {
            Verify.ParamNotNull(turnContext);

            // Arrange
            var state = new TurnState<Record, Record, TempState>();
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

            await state.LoadStateAsync(storage.Object, turnContext);
            return state;
        }
        public static TurnContext CreateConfiguredTurnContext()
        {
            return new TurnContext(new NotImplementedAdapter(), new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
        }
    }
}
