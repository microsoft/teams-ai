using Microsoft.Bot.Builder.M365.AI.Action;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Bot.Builder.M365.Tests.AI
{
    public class ActionCollectionTests
    {
        [Fact]
        public void Test_Simple()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            string name = "action";
            ActionHandler<TurnState> handler = (turnContext, turnState, data, action) => Task.FromResult(true);
            bool allowOverrides = true;

            // Act
            actionCollection.SetAction(name, handler, allowOverrides);
            ActionEntry<TurnState> entry = actionCollection.GetAction(name);

            // Assert
            Assert.True(actionCollection.HasAction(name));
            Assert.NotNull(entry);
            Assert.Equal(name, entry.Name);
            Assert.Equal(handler, entry.Handler);
            Assert.Equal(allowOverrides, entry.AllowOverrides);
        }

        [Fact]
        public void Test_Set_NonOverridable_Action_Throws_Exception()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            string name = "action";
            ActionHandler<TurnState> handler = (turnContext, turnState, data, action) => Task.FromResult(true);
            bool allowOverrides = false;
            actionCollection.SetAction(name, handler, allowOverrides);

            // Act
            var func = () => actionCollection.SetAction(name, handler, allowOverrides);

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
            var func = () => actionCollection.GetAction(nonExistentAction);

            // Assert
            Exception ex = Assert.Throws<ArgumentException>(() => func());
            Assert.Equal($"`{nonExistentAction}` action does not exist", ex.Message);
        }

        [Fact]
        public void Test_HasAction_False()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            var nonExistentAction = "non existent action";

            // Act
            bool hasAction = actionCollection.HasAction(nonExistentAction);

            // Assert
            Assert.False(hasAction);
        }

        [Fact]
        public void Test_HasAction_True()
        {
            // Arrange
            IActionCollection<TurnState> actionCollection = new ActionCollection<TurnState>();
            ActionHandler<TurnState> handler = (turnContext, turnState, data, action) => Task.FromResult(true);
            var name = "actionName";

            // Act
            actionCollection.SetAction(name, handler, true);
            bool hasAction = actionCollection.HasAction(name);

            // Assert
            Assert.True(hasAction);
        }
    }
}
