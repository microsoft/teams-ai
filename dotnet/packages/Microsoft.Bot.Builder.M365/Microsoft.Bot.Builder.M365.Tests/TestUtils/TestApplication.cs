
namespace Microsoft.Bot.Builder.M365.Tests.TestUtils
{
    public class TestApplication : Application<TestTurnState, TestTurnStateManager>
    {
        public TestApplication(TestApplicationOptions options) : base(options)
        {
        }
    }

    public class TestApplicationOptions : ApplicationOptions<TestTurnState, TestTurnStateManager> { }
}
