using Azure;
using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class SequentialDelayStrategyTests
    {
        [Fact]
        public void Test_SequentialDelayStrategy()
        {
            // Arrange
            var delays = new List<TimeSpan>()
            {
                TimeSpan.FromMilliseconds(1000),
                TimeSpan.FromMilliseconds(2000),
                TimeSpan.FromMilliseconds(3000),
            };
            var strategy = new TestSequentialDelayStrategy(delays);

            // Act
            var result1 = strategy.GetNextDelayCoreMethod(null, 1);
            var result2 = strategy.GetNextDelayCoreMethod(null, 2);
            var result3 = strategy.GetNextDelayCoreMethod(null, 3);
            var result4 = strategy.GetNextDelayCoreMethod(null, 4);

            // Assert
            Assert.Equal(TimeSpan.FromMilliseconds(1000), result1);
            Assert.Equal(TimeSpan.FromMilliseconds(2000), result2);
            Assert.Equal(TimeSpan.FromMilliseconds(3000), result3);
            Assert.Equal(TimeSpan.FromMilliseconds(3000), result4);
        }
    }

    internal sealed class TestSequentialDelayStrategy : SequentialDelayStrategy
    {
        public TestSequentialDelayStrategy(List<TimeSpan> delays) : base(delays)
        {
        }

        public TimeSpan GetNextDelayCoreMethod(Response? response, int retryNumber)
        {
            return base.GetNextDelayCore(response, retryNumber);
        }
    }
}
