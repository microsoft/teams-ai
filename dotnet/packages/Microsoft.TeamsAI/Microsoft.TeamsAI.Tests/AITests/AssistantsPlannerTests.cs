using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planner;
using Record = Microsoft.Teams.AI.State.Record;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Reflection;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AssistantsPlannerTests
    {
        [Fact]
        public async Task Test_BeginTaskAsync_Assistant_Single_Reply()
        {
            // Arrange
            var testClient = new TestAssistantsOpenAIClient();
            var planner = new AssistantsPlanner<AssistantsState>(new("test-key", "test-assistant-id"));
            planner.GetType().GetField("_openAIClient", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(planner, testClient);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = await _CreateAssistantsState();
            turnState.Temp!.Input = "hello";

            var aiOptions = new AIOptions<AssistantsState>(planner);
            var ai = new AI<AssistantsState>(aiOptions);

            testClient.RemainingRunStatus.Enqueue("completed");
            testClient.RemainingMessages.Enqueue("welcome");

            // Act
            var plan = await planner.BeginTaskAsync(turnContextMock.Object, turnState, ai, CancellationToken.None);

            // Assert
            Assert.NotNull(plan);
            Assert.NotNull(plan.Commands);
            Assert.Single(plan.Commands);
            Assert.Equal(AIConstants.SayCommand, plan.Commands[0].Type);
            Assert.Equal("welcome", ((PredictedSayCommand)plan.Commands[0]).Response);
        }

        private static async Task<AssistantsState> _CreateAssistantsState()
        {
            var state = new AssistantsState();
            var conversationState = new Record();
            var userState = new Record();

            ITurnContext turnContext = new TurnContext(new NotImplementedAdapter(), new Activity(
                text: "hello",
                channelId: "channelId",
                recipient: new() { Id = "recipientId" },
                conversation: new() { Id = "conversationId" },
                from: new() { Id = "fromId" }
            ));
            string channelId = turnContext.Activity.ChannelId;
            string botId = turnContext.Activity.Recipient.Id;
            string conversationId = turnContext.Activity.Conversation.Id;
            string userId = turnContext.Activity.From.Id;
            string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
            string userKey = $"{channelId}/${botId}/users/${userId}";

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
    }
}
