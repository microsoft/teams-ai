using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Reflection;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class AITests
    {
        [Fact]
        public void Test_RegisterAction_RegisterSameActionTwice()
        {
            // Arrange
            var planner = new TestPlanner();
            var moderator = new TestModerator();
            var options = new AIOptions<TestTurnState>(planner, moderator);
            var ai = new AI<TestTurnState>(options);
            var handler = new TestActionHandler();

            // Act
            ai.RegisterAction("test-action", handler);
            var containsAction = ai.ContainsAction("test-action");
            var exception = Assert.Throws<InvalidOperationException>(() => ai.RegisterAction("test-action", handler));

            // Assert
            Assert.True(containsAction);
            Assert.NotNull(exception);
            Assert.Equal("Attempting to register an already existing action `test-action` that does not allow overrides.", exception.Message);
        }

        [Fact]
        public async void Test_RegisterAction_OverrideDefaultAction()
        {
            // Arrange
            var planner = new TestPlanner();
            var moderator = new TestModerator();
            var options = new AIOptions<TestTurnState>(planner, moderator);
            var ai = new AI<TestTurnState>(options);
            var handler = new TestActionHandler();
            var turnContextMock = new Mock<ITurnContext>();
            var turnState = new TestTurnState();

            // Act
            ai.RegisterAction(AIConstants.UnknownActionName, handler);
            FieldInfo actionsField = typeof(AI<TestTurnState>).GetField("_actions", BindingFlags.NonPublic | BindingFlags.GetField | BindingFlags.Instance)!;
            IActionCollection<TestTurnState> actions = (IActionCollection<TestTurnState>)actionsField!.GetValue(ai)!;
            var result = await actions[AIConstants.UnknownActionName].Handler.PerformAction(turnContextMock.Object, turnState, null, null);
            var exception = Assert.Throws<InvalidOperationException>(() => ai.RegisterAction(AIConstants.UnknownActionName, handler));

            // Assert
            Assert.Equal("test-result", result);
            Assert.NotNull(exception);
            Assert.Equal($"Attempting to register an already existing action `{AIConstants.UnknownActionName}` that does not allow overrides.", exception.Message);
        }

        [Fact]
        public async void Test_RunAsync()
        {
            // Arrange
            var planner = new TestPlanner();
            var moderator = new TestModerator();
            var options = new AIOptions<TestTurnState>(planner, moderator);
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState()
            {
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };
            var actions = new TestActions();
            ai.ImportActions(actions);

            // Act
            var result = await ai.RunAsync(turnContext, turnState);

            // Assert
            Assert.True(result);
            Assert.Equal(new string[] { "BeginTaskAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "ReviewInput", "ReviewOutput" }, moderator.Record.ToArray());
            Assert.Equal(new string[] { "Test-DO" }, actions.DoActionRecord.ToArray());
            Assert.Equal(new string[] { "Test-SAY" }, actions.SayActionRecord.ToArray());
        }

        [Fact]
        public async void Test_RunAsync_ExceedStepLimit()
        {
            // Arrange
            var planner = new TestPlanner();
            var moderator = new TestModerator();
            var options = new AIOptions<TestTurnState>(planner, moderator);
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState()
            {
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };
            var actions = new TestActions();
            ai.ImportActions(actions);
            ai.RegisterAction(AIConstants.TooManyStepsActionName, new TestActionHandler());

            // Act
            var result = await ai.RunAsync(turnContext, turnState, stepCount: 30);

            // Assert
            Assert.False(result);
            Assert.Equal(new string[] { "ContinueTaskAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "ReviewOutput" }, moderator.Record.ToArray());
            Assert.Equal(new string[] { }, actions.DoActionRecord.ToArray());
            Assert.Equal(new string[] { }, actions.SayActionRecord.ToArray());
        }

        [Fact]
        public async void Test_RunAsync_ExceedTimeLimit()
        {
            // Arrange
            var planner = new TestPlanner();
            var moderator = new TestModerator();
            var options = new AIOptions<TestTurnState>(planner, moderator, maxTime: TimeSpan.Zero);
            var ai = new AI<TestTurnState>(options);
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState()
            {
                TempStateEntry = new TurnStateEntry<TempState>(new())
            };
            var actions = new TestActions();
            ai.ImportActions(actions);
            ai.RegisterAction(AIConstants.TooManyStepsActionName, new TestActionHandler());

            // Act
            var result = await ai.RunAsync(turnContext, turnState);

            // Assert
            Assert.False(result);
            Assert.Equal(new string[] { "BeginTaskAsync" }, planner.Record.ToArray());
            Assert.Equal(new string[] { "ReviewInput", "ReviewOutput" }, moderator.Record.ToArray());
            Assert.Equal(new string[] { }, actions.DoActionRecord.ToArray());
            Assert.Equal(new string[] { }, actions.SayActionRecord.ToArray());
        }

        /// <summary>
        /// Override default DO and SAY actions for test
        /// </summary>
        private sealed class TestActions
        {
            public IList<string> DoActionRecord { get; } = new List<string>();

            public IList<string> SayActionRecord { get; } = new List<string>();

            [Action("Test-DO")]
            public string DoCommand([ActionName] string action)
            {
                DoActionRecord.Add(action);
                return string.Empty;
            }

            [Action(AIConstants.SayCommandActionName)]
            public string SayCommand([ActionParameters] PredictedSayCommand command)
            {
                SayActionRecord.Add(command.Response);
                return string.Empty;
            }
        }
    }
}
