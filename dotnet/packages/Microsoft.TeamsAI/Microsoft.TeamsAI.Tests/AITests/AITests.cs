using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AITests
    {
        [Fact]
        public async void Test_Run_NotImplemented()
        {
            // Arrange
            var planner = new TestPlanner();
            var promptManager = new TestPromptManager();
            var moderator = new TestModerator();
            var options = new AIOptions<TestTurnState>(planner, promptManager, moderator)
            {
                Prompt = "Test",
                History = new AIHistoryOptions
                {
                    TrackHistory = false
                }
            };
            var ai = new AI<TestTurnState>(options);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = new TestTurnState();

            // Act
            var exception = await Assert.ThrowsAsync<NotImplementedException>(async () => await ai.Run(turnContextMock.Object, turnState));

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
}
