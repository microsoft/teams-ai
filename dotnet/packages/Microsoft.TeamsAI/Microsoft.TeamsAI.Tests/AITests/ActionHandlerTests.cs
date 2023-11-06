using System.Reflection;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
using Microsoft.Teams.AI.AI.Prompt;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Tests.TestUtils;
using Microsoft.Bot.Schema;
using Moq;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class ActionHandlerTests
    {
        [Fact]
        public void Test_Actions_DifferentReturnTypes()
        {
            // Arrange
            var instance = new DifferentReturnTypesActions();
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState();
            var actionNames = new[] { "action1", "action2", "action3", "action4", "action5", "action6" };

            // Act
            IActionCollection<TestTurnState> actions = ImportActions<TestTurnState>(instance);
            foreach (var actionName in actionNames)
            {
                actions[actionName].Handler.PerformAction(turnContext, turnState);
            }

            // Assert
            foreach (var actionName in actionNames)
            {
                Assert.True(actions.ContainsAction(actionName));
            }
            Assert.Equal(actionNames, instance.Calls.ToArray());
        }

        [Fact]
        public void Test_Actions_DifferentParameterAttributes()
        {
            // Arrange
            var instance = new DifferentParameterAttributesActions<TestTurnState>();
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState();
            var actionNames = new[] { "action1", "action2", "action3", "action4", "action5", "action6" };
            var entities = new object();

            // Act
            IActionCollection<TestTurnState> actions = ImportActions<TestTurnState>(instance);
            foreach (var actionName in actionNames)
            {
                actions[actionName].Handler.PerformAction(turnContext, turnState, entities, actionName);
            }

            // Assert
            foreach (var actionName in actionNames)
            {
                Assert.True(actions.ContainsAction(actionName));
            }
            var expectedCalls = new[]
            {
                new object?[] { turnContext, turnState, entities, actionNames[0] },
                new object?[] { actionNames[1], entities, turnState, turnContext },
                new object?[] { turnContext, actionNames[2] },
                new object?[] { turnContext, null, 0 },
                new object?[] { turnState, turnState, actionNames[4] },
                new object?[] { }
            };
            Assert.Equal(expectedCalls, instance.Calls.ToArray());
        }

        [Theory]
        [MemberData(nameof(ParameterAssignTestData))]
        public async Task Test_Actions_ParameterAssign_Exception(object instance, Type from, Type to)
        {
            // Arrange
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TestTurnState();
            var actionName = "action";
            var entities = new object();

            // Act
            IActionCollection<TestTurnState> actions = ImportActions<TestTurnState>(instance);
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () => await actions[actionName].Handler.PerformAction(turnContext, turnState, entities, actionName));

            // Assert
            Assert.NotNull(exception);
            Assert.Equal($"Cannot assign {from} to {to} of action method Action", exception.Message);
        }

        private static IActionCollection<TState> ImportActions<TState>(object instance) where TState : ITurnState<StateBase, StateBase, TempState>
        {
            AIOptions<TState> options = new(
                new Mock<IPlanner<TState>>().Object,
                new PromptManager<TState>(),
                new Mock<IModerator<TState>>().Object);
            AI<TState> ai = new(options);
            ai.ImportActions(instance);
            // get _actions field from AI class
            FieldInfo actionsField = typeof(AI<TState>).GetField("_actions", BindingFlags.NonPublic | BindingFlags.GetField | BindingFlags.Instance)!;
            return (IActionCollection<TState>)actionsField!.GetValue(ai)!;
        }

        private static IEnumerable<object[]> ParameterAssignTestData()
        {
            yield return new object[]
            {
                new TestActions<string, TestTurnState, object, string>(),
                typeof(TurnContext),
                typeof(string),
            };
            yield return new object[]
            {
                new TestActions<TurnContext, string, object, string>(),
                typeof(TestTurnState),
                typeof(string),
            };
            yield return new object[]
            {
                new TestActions<TurnContext, TestTurnState, string, string>(),
                typeof(object),
                typeof(string),
            };
            yield return new object[]
            {
                new TestActions<TurnContext, TestTurnState, object, int>(),
                typeof(string),
                typeof(int),
            };
        }

        private sealed class DifferentReturnTypesActions
        {
            public List<string> Calls { get; set; } = new List<string>();

            [Action("action1")]
            public void Action1()
            {
                Calls.Add("action1");
            }

            [Action("action2")]
            public bool Action2()
            {
                Calls.Add("action2");
                return true;
            }

            [Action("action3")]
            public Task Action3()
            {
                Calls.Add("action3");
                return Task.CompletedTask;
            }

            [Action("action4")]
            public Task<bool> Action4()
            {
                Calls.Add("action4");
                return Task.FromResult(true);
            }

            [Action("action5")]
            public ValueTask Action5()
            {
                Calls.Add("action5");
                return ValueTask.CompletedTask;
            }

            [Action("action6")]
            public ValueTask<bool> Action6()
            {
                Calls.Add("action6");
                return ValueTask.FromResult(true);
            }
        }

        private sealed class DifferentParameterAttributesActions<TState> where TState : ITurnState<StateBase, StateBase, TempState>
        {
            public List<object?[]> Calls { get; set; } = new List<object?[]>();

            [Action("action1")]
            public void Action1([ActionTurnContext] ITurnContext context, [ActionTurnState] TState state, [ActionEntities] object entities, [ActionName] string name)
            {
                Calls.Add(new[] { context, state, entities, name });
            }

            [Action("action2")]
            public void Action2([ActionName] string name, [ActionEntities] object entities, [ActionTurnState] TState state, [ActionTurnContext] ITurnContext context)
            {
                Calls.Add(new[] { name, entities, state, context });
            }

            [Action("action3")]
            public void Action3([ActionTurnContext] ITurnContext context, [ActionName] string name)
            {
                Calls.Add(new object?[] { context, name });
            }

            [Action("action4")]
            public void Action4([ActionTurnContext] ITurnContext context, ITurnContext myContext, int myInt)
            {
                Calls.Add(new object?[] { context, myContext, myInt });
            }

            [Action("action5")]
            public void Action5([ActionTurnState] TState state1, [ActionTurnState] TState state2, [ActionName] string name)
            {
                Calls.Add(new object?[] { state1, state2, name });
            }

            [Action("action6")]
            public void Action6()
            {
                Calls.Add(new object?[] { });
            }
        }

        private sealed class TestActions<TContext, TState, TEntities, TName>
        {
            [Action("action")]
            public static void Action([ActionTurnContext] TContext _0, [ActionTurnState] TState _1, [ActionEntities] TEntities _2, [ActionName] TName _3) { }
        }
    }
}
