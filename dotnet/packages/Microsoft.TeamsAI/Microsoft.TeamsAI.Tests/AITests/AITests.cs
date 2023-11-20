using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AITests
    {
        [Fact]
        public async void Test_Run_NotImplemented()
        {
            // Arrange
            var planner = new TestTurnStatePlanner<TurnState>();
            var promptManager = new PromptManager<TurnState<Record, Record, TempState>>();
            var moderator = new DefaultModerator<TurnState<Record, Record, TempState>>();
            var options = new AIOptions<TurnState<Record, Record, TempState>>(planner, promptManager, moderator)
            {
                Prompt = "Test",
                History = new AIHistoryOptions
                {
                    TrackHistory = false
                }
            };
            var ai = new AI<TurnState<Record, Record, TempState>>(options);
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new TurnContext(botAdapterStub,
                new Activity
                {
                    Text = "user message",
                    Recipient = new() { Id = "recipientId" },
                    Conversation = new() { Id = "conversationId" },
                    From = new() { Id = "fromId" },
                    ChannelId = "channelId"
                });
            var turnState = TurnStateConfig.GetTurnStateWithConversationStateAsync(turnContextMock);

            // Act
            var exception = await Assert.ThrowsAsync<NotImplementedException>(async () => await ai.Run(turnContextMock, turnState.Result));

            // Assert
            Assert.NotNull(exception);
        }

        /// <summary>
        /// Override default DO and SAY actions for test
        /// </summary>
        private sealed class TestActions
        {
            public IList<string> DoActionRecord { get; } = new List<string>();

            public IList<string> SayActionRecord { get; } = new List<string>();

            [Action("Test-DO")]
            public bool DoCommand([ActionName] string action)
            {
                DoActionRecord.Add(action);
                return true;
            }

            [Action(AIConstants.SayCommandActionName)]
            public bool SayCommand([ActionEntities] PredictedSayCommand command)
            {
                SayActionRecord.Add(command.Response);
                return true;
            }
        }
    }

    internal class TestTurnStatePlanner<T> : IPlanner<TurnState<Record, Record, TempState>>
    {

        public Plan BeginPlan { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedSayCommand("Test-SAY")
            }
        };
        public Plan ContinuePlan { get; set; } = new Plan();
        public Task<Plan> BeginTaskAsync(ITurnContext turnContext, TurnState<Record, Record, TempState> turnState, AI<TurnState<Record, Record, TempState>> ai, CancellationToken cancellationToken)
        {
            return Task.FromResult(BeginPlan);
        }

        public Task<Plan> ContinueTaskAsync(ITurnContext turnContext, TurnState<Record, Record, TempState> turnState, AI<TurnState<Record, Record, TempState>> ai, CancellationToken cancellationToken)
        {
            return Task.FromResult(ContinuePlan);
        }
    }
}
