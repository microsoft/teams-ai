using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.TeamsAI.Tests.TestUtils;
using System.Reflection;

namespace Microsoft.TeamsAI.Tests
{
    public class ApplicationTests
    {
        [Fact]
        public void Test_StartTypingTimer_MessageActivityType()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.Message };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new());

            // Act
            app.StartTypingTimer(turnContext);

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.NotNull(timer);
            Assert.Equal(timer.GetType(), typeof(TypingTimer));
        }

        [Fact]
        public void Test_StartTypingTimer_MessageActivityType_DoubleStart_DoesNothing()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.Message };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new());

            // Act 1
            app.StartTypingTimer(turnContext);

            // Assert 1
            var timer1 = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.NotNull(timer1);
            Assert.Equal(timer1.GetType(), typeof(TypingTimer));

            // Act 2
            app.StartTypingTimer(turnContext);

            // Assert 2
            var timer2 = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.NotNull(timer2);
            Assert.Equal(timer2.GetType(), typeof(TypingTimer));
            Assert.Equal(timer2, timer2);
        }

        [Fact]
        public void Test_StartTypingTimer_NonMessageActivityType_DoesNothing()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new());

            // Act
            app.StartTypingTimer(turnContext);

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);
            Assert.Null(timer);
        }

        [Fact]
        public void Test_StopTypingTimer_WithoutEverStartingTypingTimer()
        {
            // Arrange
            var app = new Application<TestTurnState, TestTurnStateManager>(new());

            // Act
            app.StopTypingTimer();

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);

            Assert.Null(timer);
        }

        [Fact]
        public void Test_Start_Then_StopTypingTimer_MessageActivityType_DisposesTypingTimer()
        {
            // Arrange
            var activity = new Activity { Type = ActivityTypes.MessageUpdate };
            var turnContext = new TurnContext(new SimpleAdapter(), activity);
            var app = new Application<TestTurnState, TestTurnStateManager>(new());

            // Act
            app.StartTypingTimer(turnContext);
            app.StopTypingTimer();

            // Assert
            var timer = app.GetType().GetField("_typingTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(app);
            Assert.Null(timer);
        }
    }
}
