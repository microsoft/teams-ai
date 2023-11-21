using System.Reflection;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.AI.Planner;
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
            var turnState = new TurnState();
            var actionNames = new[] { "action1", "action2", "action3" };

            // Act
            IActionCollection<TurnState> actions = ImportActions<TurnState>(instance);
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
            var instance = new DifferentParameterAttributesActions<TurnState>();
            var turnContext = new TurnContext(new NotImplementedAdapter(), MessageFactory.Text("hello"));
            var turnState = new TurnState();
            var actionNames = new[] { "action1", "action2", "action3", "action4", "action5", "action6" };
            var entities = new object();

            // Act
            IActionCollection<TurnState> actions = ImportActions<TurnState>(instance);
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
            var turnState = new TurnState();
            var actionName = "action";
            var entities = new object();

            // Act
            IActionCollection<TurnState> actions = ImportActions<TurnState>(instance);
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () => await actions[actionName].Handler.PerformAction(turnContext, turnState, entities, actionName));

            // Assert
            Assert.NotNull(exception);
            Assert.Equal($"Cannot assign {from} to {to} of action method Action", exception.Message);
        }

        private static IActionCollection<TState> ImportActions<TState>(object instance) where TState : TurnState
        {
            AIOptions<TState> options = new(
                new Mock<IPlanner<TState>>().Object,
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
                new TestActions<string, TurnState, object, string>(),
                typeof(TurnContext),
                typeof(string),
            };
            yield return new object[]
            {
                new TestActions<TurnContext, string, object, string>(),
                typeof(TurnState),
                typeof(string),
            };
            yield return new object[]
            {
                new TestActions<TurnContext, TurnState, string, string>(),
                typeof(object),
                typeof(string),
            };
            yield return new object[]
            {
                new TestActions<TurnContext, TurnState, object, int>(),
                typeof(string),
                typeof(int),
            };
        }

        private sealed class DifferentReturnTypesActions
        {
            public List<string> Calls { get; set; } = new List<string>();

            [Action("action1")]
            public string Action1()
            {
                Calls.Add("action1");
                return string.Empty;
            }

            [Action("action2")]
            public Task<string> Action2()
            {
                Calls.Add("action2");
                return Task.FromResult(string.Empty);
            }

            [Action("action3")]
            public ValueTask<string> Action6()
            {
                Calls.Add("action3");
                return ValueTask.FromResult(string.Empty);
            }
        }

        private sealed class DifferentParameterAttributesActions<TState> where TState : TurnState
        {
            public List<object?[]> Calls { get; set; } = new List<object?[]>();

            [Action("action1")]
            public string Action1([ActionTurnContext] ITurnContext context, [ActionTurnState] TState state, [ActionParameters] object entities, [ActionName] string name)
            {
                Calls.Add(new[] { context, state, entities, name });
                return string.Empty;
            }

            [Action("action2")]
            public string Action2([ActionName] string name, [ActionParameters] object entities, [ActionTurnState] TState state, [ActionTurnContext] ITurnContext context)
            {
                Calls.Add(new[] { name, entities, state, context });
                return string.Empty;
            }

            [Action("action3")]
            public string Action3([ActionTurnContext] ITurnContext context, [ActionName] string name)
            {
                Calls.Add(new object?[] { context, name });
                return string.Empty;
            }

            [Action("action4")]
            public string Action4([ActionTurnContext] ITurnContext context, ITurnContext myContext, int myInt)
            {
                Calls.Add(new object?[] { context, myContext, myInt });
                return string.Empty;
            }

            [Action("action5")]
            public string Action5([ActionTurnState] TState state1, [ActionTurnState] TState state2, [ActionName] string name)
            {
                Calls.Add(new object?[] { state1, state2, name });
                return string.Empty;
            }

            [Action("action6")]
            public string Action6()
            {
                Calls.Add(new object?[] { });
                return string.Empty;
            }
        }

        private sealed class TestActions<TContext, TState, TEntities, TName>
        {
            [Action("action")]
            public static string Action([ActionTurnContext] TContext _0, [ActionTurnState] TState _1, [ActionParameters] TEntities _2, [ActionName] TName _3)
            {
                return string.Empty;
            }
        }
    }
}
