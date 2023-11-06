using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AITests
    {
        [Fact]
        public async Task AI_ChainAsync_Default_Prompt()
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
            var actions = new TestActions();
            ai.ImportActions(actions);

            // Act
            var result = await ai.ChainAsync(turnContextMock.Object, turnState);

            // Assert
            Assert.True(result);
            Assert.Equal(new string[] { "GeneratePlanAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "RenderPromptAsync", "RenderPromptAsync" }, promptManager.Record.ToArray());
            Assert.Equal(new string[] { "ReviewPrompt", "ReviewPlan" }, moderator.Record.ToArray());
            Assert.Equal(new string[] { "Test-DO" }, actions.DoActionRecord.ToArray());
            Assert.Equal(new string[] { "Test-SAY" }, actions.SayActionRecord.ToArray());
        }

        [Fact]
        public async Task AI_ChainAsync_PromptTemplate()
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
            var actions = new TestActions();
            ai.ImportActions(actions);
            var prompt = new PromptTemplate("Test", new());

            // Act
            var result = await ai.ChainAsync(turnContextMock.Object, turnState, prompt);

            // Assert
            Assert.True(result);
            Assert.Equal(new string[] { "GeneratePlanAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "RenderPromptAsync" }, promptManager.Record.ToArray());
            Assert.Equal(new string[] { "ReviewPrompt", "ReviewPlan" }, moderator.Record.ToArray());
            Assert.Equal(new string[] { "Test-DO" }, actions.DoActionRecord.ToArray());
            Assert.Equal(new string[] { "Test-SAY" }, actions.SayActionRecord.ToArray());
        }

        [Fact]
        public async Task AI_ChainAsync_TempState_IsSet()
        {
            // Arrange
            var options = new AIOptions<TestTurnState>(new TestPlanner(), new TestPromptManager())
            {
                Prompt = "Test",
                History = new AIHistoryOptions
                {
                    TrackHistory = false
                }
            };
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState
            {
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };
            var actions = new TestActions();
            ai.ImportActions(actions);

            // Act
            var result = await ai.ChainAsync(turnContext, turnState);

            // Assert
            Assert.True(result);
            Assert.Equal("hello", turnState.Temp!.Input);
        }

        [Fact]
        public async Task AI_ChainAsync_History_IsSet()
        {
            // Arrange
            var options = new AIOptions<TestTurnState>(new TestPlanner(), new TestPromptManager())
            {
                Prompt = "Test",
                History = new AIHistoryOptions
                {
                    TrackHistory = true,
                    AssistantHistoryType = AssistantHistoryType.Text
                }
            };
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState
            {
                ConversationStateEntry = new TurnStateEntry<StateBase>(new()),
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };
            // Add last history
            ConversationHistory.AddLine(turnState, "test");
            var actions = new TestActions();
            ai.ImportActions(actions);

            // Act
            var result = await ai.ChainAsync(turnContext, turnState);

            // Assert
            Assert.True(result);
            Assert.Equal("test", turnState.Temp!.History);
            Assert.Equal(new string[] { "test", "User: hello", "Assistant:, Test-SAY" }, ConversationHistory.GetHistory(turnState).ToArray());
        }

        [Fact]
        public async Task AI_CompletePromptAsync_PromptName()
        {
            // Arrange
            var planner = new TestPlanner();
            var promptManager = new TestPromptManager();
            var options = new AIOptions<TestTurnState>(planner, promptManager)
            {
                Prompt = "Test"
            };
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState
            {
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };

            // Act
            var result = await ai.CompletePromptAsync(turnContext, turnState, "Test", null, CancellationToken.None);

            // Assert
            Assert.Equal("Default", result);
            Assert.Equal(new string[] { "CompletePromptAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "RenderPromptAsync" }, promptManager.Record.ToArray());
            Assert.Equal("hello", turnState.Temp?.Input);
        }

        [Fact]
        public async Task AI_CompletePromptAsync_PromptTemplate()
        {
            // Arrange
            var planner = new TestPlanner();
            var promptManager = new TestPromptManager();
            var options = new AIOptions<TestTurnState>(planner, promptManager)
            {
                Prompt = "Test"
            };
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState
            {
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };
            var prompt = new PromptTemplate("Test", new());

            // Act
            var result = await ai.CompletePromptAsync(turnContext, turnState, prompt, null, CancellationToken.None);

            // Assert
            Assert.Equal("Default", result);
            Assert.Equal(new string[] { "CompletePromptAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "RenderPromptAsync" }, promptManager.Record.ToArray());
            Assert.Equal("hello", turnState.Temp?.Input);
        }

        [Fact]
        public async Task AI_CompletePromptAsync_CreateSemanticFunction()
        {
            // Arrange
            var planner = new TestPlanner();
            var promptManager = new TestPromptManager();
            var options = new AIOptions<TestTurnState>(planner, promptManager)
            {
                Prompt = "Test"
            };
            var ai = new AI<TestTurnState>(options);
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = new TestTurnState();
            var prompt = new PromptTemplate("Test", new());

            // Act
            var function = ai.CreateSemanticFunction("Test", prompt, null);
            var result = await function(turnContextMock.Object, turnState);

            // Assert
            Assert.NotNull(function);
            Assert.Equal("Default", result);
            Assert.Equal(new string[] { "CompletePromptAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "AddPromptTemplate", "RenderPromptAsync" }, promptManager.Record.ToArray());
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
