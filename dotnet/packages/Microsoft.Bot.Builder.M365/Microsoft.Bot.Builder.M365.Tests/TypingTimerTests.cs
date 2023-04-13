using Microsoft.Bot.Schema;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Microsoft.Bot.Builder.M365.Tests
{
    public class TypingTimerTests
    {

        [Fact]
        public void StartTypingTimer_MessageActivityType()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = ActivityTypes.Message });

            int timerDelay = 1000;
            TypingTimer typingTimer = new TypingTimer(timerDelay);

            // Act
            typingTimer.StartTypingTimer(turnContextMock.Object);

            // Assert
            Assert.NotNull(typingTimer.timer);
        }

        [Fact]
        public void StartTypingTimer_NotMessageActivityType()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var notMessageActivityType = ActivityTypes.Invoke;
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = notMessageActivityType });

            int timerDelay = 1000;
            TypingTimer typingTimer = new TypingTimer(timerDelay);

            // Act
            typingTimer.StartTypingTimer(turnContextMock.Object);

            // Assert
            Assert.Null(typingTimer.timer);
        }

        [Fact]
        public void StartTypingTimer_Registers_OnSendActivites_EventHandler()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup(tc => tc.Activity).Returns(new Activity { Type = ActivityTypes.Message });
            turnContextMock.Setup(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()));

            int timerDelay = 1000;
            TypingTimer typingTimer = new TypingTimer(timerDelay);

            // Act
            typingTimer.StartTypingTimer(turnContextMock.Object);

            // Assert
            turnContextMock.Verify(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()), Times.Once);

        }

        [Fact]
        public void StopTypingTimer_ShouldResetProperties()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = ActivityTypes.Message });

            int timerDelay = 1000;
            TypingTimer typingTimer = new TypingTimer(timerDelay);

            // Act
            typingTimer.StartTypingTimer(turnContextMock.Object);
            typingTimer.StopTypingTimer();

            // Assert
            Assert.Null(typingTimer.timer);
        }
    }
}
