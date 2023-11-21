using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Moq;
using System.Reflection;
using Plan = Microsoft.Teams.AI.AI.Planner.Plan;
using Record = Microsoft.Teams.AI.State.Record;
using TestTurnState = Microsoft.Teams.AI.Tests.TestUtils.TestTurnState;

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
            var planner = new TestTurnStatePlanner<TurnState>();
            var moderator = new TestTurnStateModerator<TurnState<Record, Record, TempState>>();
            var options = new AIOptions<TurnState<Record, Record, TempState>>(planner, moderator);
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
            var actions = new TestActions();
            ai.ImportActions(actions);

            // Act
            var result = await ai.RunAsync(turnContextMock, turnState.Result);

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
            var planner = new TestTurnStatePlanner<TurnState>();
            var moderator = new TestTurnStateModerator<TurnState<Record, Record, TempState>>();
            var options = new AIOptions<TurnState<Record, Record, TempState>>(planner, moderator);
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
            var actions = new TestActions();
            ai.ImportActions(actions);
            var actionHandler = new TestTurnStateActionHandler();
            ai.RegisterAction(AIConstants.TooManyStepsActionName, actionHandler);

            // Act
            var result = await ai.RunAsync(turnContextMock, turnState.Result, stepCount: 30);

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
            var planner = new TestTurnStatePlanner<TurnState>();
            var moderator = new TestTurnStateModerator<TurnState<Record, Record, TempState>>();
            var options = new AIOptions<TurnState<Record, Record, TempState>>(planner, moderator, maxTime: TimeSpan.Zero);
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
            var actions = new TestActions();
            ai.ImportActions(actions);
            ai.RegisterAction(AIConstants.TooManyStepsActionName, new TestTurnStateActionHandler());

            // Act
            var result = await ai.RunAsync(turnContextMock, turnState.Result);

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

    internal sealed class TestTurnStateActionHandler : IActionHandler<TurnState<Record, Record, TempState>>
    {
        public string? ActionName { get; set; }
        public Task<string> PerformAction(ITurnContext turnContext, TurnState<Record, Record, TempState> turnState, object? entities = null, string? action = null)
        {
            ActionName = action;
            return Task.FromResult("test-result");
        }
    }

    internal sealed class TestTurnStateModerator<TState> : IModerator<TState> where TState : ITurnState<Record, Record, TempState>
    {
        public IList<string> Record { get; } = new List<string>();

        public Task<Plan?> ReviewInput(ITurnContext turnContext, TState turnState)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult<Plan?>(null);
        }

        public Task<Plan> ReviewOutput(ITurnContext turnContext, TState turnState, Plan plan)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(plan);
        }
    }

    internal sealed class TestTurnStatePlanner<T> : IPlanner<TurnState<Record, Record, TempState>>
    {
        public IList<string> Record { get; } = new List<string>();

        public Plan BeginPlan { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedDoCommand("Test-DO"),
                new PredictedSayCommand("Test-SAY")
            }
        };

        public Plan ContinuePlan { get; set; } = new Plan
        {
            Commands = new List<IPredictedCommand>
            {
                new PredictedDoCommand("Test-DO"),
                new PredictedSayCommand("Test-SAY")
            }
        };

        public Task<Plan> BeginTaskAsync(ITurnContext turnContext, TurnState<Record, Record, TempState> turnState, AI<TurnState<Record, Record, TempState>> ai, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(BeginPlan);
        }

        public Task<Plan> ContinueTaskAsync(ITurnContext turnContext, TurnState<Record, Record, TempState> turnState, AI<TurnState<Record, Record, TempState>> ai, CancellationToken cancellationToken)
        {
            Record.Add(MethodBase.GetCurrentMethod()!.Name);
            return Task.FromResult(ContinuePlan);
        }
    }
}
