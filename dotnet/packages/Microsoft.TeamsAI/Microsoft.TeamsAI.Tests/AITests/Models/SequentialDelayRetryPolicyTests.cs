using Microsoft.Teams.AI.AI.Models;
using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.Tests.AITests.Models
{
    public class SequentialDelayRetryPolicyTests
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
            var strategy = new TestSequentialDelayRetryPolicy(delays);

            // Act
            var result1 = strategy.GetNextDelayMethod(null, 1);
            var result2 = strategy.GetNextDelayMethod(null, 2);
            var result3 = strategy.GetNextDelayMethod(null, 3);
            var result4 = strategy.GetNextDelayMethod(null, 4);

            // Assert
            Assert.Equal(TimeSpan.FromMilliseconds(1000), result1);
            Assert.Equal(TimeSpan.FromMilliseconds(2000), result2);
            Assert.Equal(TimeSpan.FromMilliseconds(3000), result3);
            Assert.Equal(TimeSpan.FromMilliseconds(3000), result4);
        }
    }

    internal sealed class TestSequentialDelayRetryPolicy : SequentialDelayRetryPolicy
    {
        public TestSequentialDelayRetryPolicy(List<TimeSpan> delays) : base(delays)
        {
        }

        public TimeSpan GetNextDelayMethod(PipelineMessage? message, int tryCount)
        {
            return GetNextDelay(message!, tryCount);
        }
    }
}
