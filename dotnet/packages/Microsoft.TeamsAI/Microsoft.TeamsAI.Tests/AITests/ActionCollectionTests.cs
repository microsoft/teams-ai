using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class ActionCollectionTests
    {
        [Fact]
        public void Test_Simple()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            string name = "action";
            IActionHandler<TurnState> handler = new TestActionHandler();
            bool allowOverrides = true;

            // Act
            actionCollection.AddAction(name, handler, allowOverrides);
            ActionEntry<TurnState> entry = actionCollection[name];
            bool tryGet = actionCollection.TryGetAction(name, out ActionEntry<TurnState> tryGetEntry);

            // Assert
            Assert.True(actionCollection.ContainsAction(name));
            Assert.NotNull(entry);
            Assert.Equal(name, entry.Name);
            Assert.Equal(handler, entry.Handler);
            Assert.Equal(allowOverrides, entry.AllowOverrides);
            Assert.True(tryGet);
            Assert.NotNull(tryGetEntry);
            Assert.Equal(name, tryGetEntry.Name);
            Assert.Equal(handler, tryGetEntry.Handler);
            Assert.Equal(allowOverrides, tryGetEntry.AllowOverrides);
        }

        [Fact]
        public void Test_Add_NonOverridable_Action_Throws_Exception()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            string name = "action";
            IActionHandler<TurnState> handler = new TestActionHandler();
            bool allowOverrides = false;
            actionCollection.AddAction(name, handler, allowOverrides);

            // Act
            var func = () => actionCollection.AddAction(name, handler, allowOverrides);

            // Assert
            Exception ex = Assert.Throws<ArgumentException>(() => func());
            Assert.Equal($"Action {name} already exists and does not allow overrides", ex.Message);
        }

        [Fact]
        public void Test_Get_NonExistent_Action()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            var nonExistentAction = "non existent action";

            // Act
            var func = () => actionCollection[nonExistentAction];

            // Assert
            Exception ex = Assert.Throws<ArgumentException>(() => func());
            Assert.Equal($"`{nonExistentAction}` action does not exist", ex.Message);
        }

        [Fact]
        public void Test_TryGet_NonExistent_Action()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            var nonExistentAction = "non existent action";

            // Act
            var result = actionCollection.TryGetAction(nonExistentAction, out ActionEntry<TurnState> actionEntry);

            // Assert
            Assert.False(result);
            Assert.Null(actionEntry);
        }

        [Fact]
        public void Test_ContainsAction_False()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            var nonExistentAction = "non existent action";

            // Act
            bool containsAction = actionCollection.ContainsAction(nonExistentAction);

            // Assert
            Assert.False(containsAction);
        }

        [Fact]
        public void Test_ContainsAction_True()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            IActionHandler<TurnState> handler = new TestActionHandler();
            var name = "actionName";

            // Act
            actionCollection.AddAction(name, handler, true);
            bool containsAction = actionCollection.ContainsAction(name);

            // Assert
            Assert.True(containsAction);
        }

        private sealed class TestActionHandler : IActionHandler<TurnState>
        {
            public Task<string> PerformAction(ITurnContext turnContext, TurnState turnState, object? entities = null, string? action = null)
            {
                return Task.FromResult(string.Empty);
            }
        }
    }
}
