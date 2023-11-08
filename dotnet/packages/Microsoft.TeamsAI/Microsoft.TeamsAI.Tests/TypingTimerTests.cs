using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Moq;

namespace Microsoft.Teams.AI.Tests
{
    public class TypingTimerTests
    {

        [Fact]
        public void Start_MessageActivityType()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = ActivityTypes.Message });

            int timerDelay = 1000;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);

            // Assert
            Assert.True(typingTimer.IsRunning());
        }

        [Fact]
        public void Start_DoubleStart_ShouldFail()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = ActivityTypes.Message });

            int timerDelay = 1000;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);

            // Assert
            Assert.False(typingTimer.Start(turnContextMock.Object));
        }

        [Fact]
        public void Start_NotMessageActivityType()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var notMessageActivityType = ActivityTypes.Invoke;
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = notMessageActivityType });

            int timerDelay = 1000;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);

            // Assert
            Assert.False(typingTimer.IsRunning());
        }

        [Fact]
        public void Start_Registers_OnSendActivites_EventHandler()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup(tc => tc.Activity).Returns(new Activity { Type = ActivityTypes.Message });
            turnContextMock.Setup(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()));

            int timerDelay = 1000;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);

            // Assert
            turnContextMock.Verify(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()), Times.Once);

        }

        [Fact]
        public void Start_ShouldSendTypingActivity_OneAtATime()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup(tc => tc.Activity).Returns(new Activity { Type = ActivityTypes.Message });
            turnContextMock.Setup(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()));
            turnContextMock.Setup(tc => tc.SendActivityAsync(It.IsAny<Activity>(), It.IsAny<CancellationToken>())).Callback(() =>
            {
                // Blocking the thread for 2 seconds to simulate a long running operation
                Thread.Sleep(2000);
            });

            // Sending typing activity 10 times per second
            int timerDelay = 100;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);

            // In the mean time, simulating sending 10 typing activities
            Thread.Sleep(1000);

            // Assert
            // Only one typing timer is sent
            turnContextMock.Verify(tc => tc.SendActivityAsync(It.IsAny<Activity>(), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Theory]
        [MemberData(nameof(ExceptionTestData))]
        public void Start_ShouldIgnoreExpectedException(Exception ex)
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<ITurnContext>();
            turnContextMock.Setup(tc => tc.Activity).Returns(new Activity { Type = ActivityTypes.Message });
            turnContextMock.Setup(tc => tc.OnSendActivities(It.IsAny<SendActivitiesHandler>()));
            turnContextMock.Setup(tc => tc.SendActivityAsync(It.IsAny<Activity>(), It.IsAny<CancellationToken>())).Callback(() =>
            {
                // throw expected exception
                throw ex;
            });

            // Sending typing activity 10 times per second
            int timerDelay = 100;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);

            // In the mean time, simulating sending 10 typing activities
            Thread.Sleep(1000);

            // Assert
            Assert.False(typingTimer.IsRunning());
        }

        [Fact]
        public void Dispose_ShouldResetProperties()
        {
            // Arrange
            var botAdapterStub = Mock.Of<BotAdapter>();
            var turnContextMock = new Mock<TurnContext>(botAdapterStub, new Activity { Type = ActivityTypes.Message });

            int timerDelay = 1000;
            TypingTimer typingTimer = new(timerDelay);

            // Act
            typingTimer.Start(turnContextMock.Object);
            typingTimer.Dispose();

            // Assert
            Assert.False(typingTimer.IsRunning());
        }

        private static IEnumerable<object[]> ExceptionTestData()
        {
            yield return new[]
            {
                new ObjectDisposedException("test")
            };
            yield return new[]
            {
                new TaskCanceledException("test")
            };

            yield return new[]
            {
#pragma warning disable CA2201 // Do not raise reserved exception types
                // For test purpose only
                new NullReferenceException()
#pragma warning restore CA2201 // Do not raise reserved exception types
            };

        }
    }
}
