using Microsoft.Extensions.Logging;

namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    public class TestApplication : Application<TestTurnState, TestTurnStateManager>
    {
        public TestApplication(TestApplicationOptions options, ILogger? logger = null) : base(options, logger)
        {
        }
    }

    public class TestApplicationOptions : ApplicationOptions<TestTurnState, TestTurnStateManager> { }
}
