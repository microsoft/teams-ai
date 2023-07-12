
namespace Microsoft.TeamsAI.Tests.TestUtils
{
    public class TestApplication : Application<TestTurnState, TestTurnStateManager>
    {
        public TestApplication(TestApplicationOptions options) : base(options)
        {
        }
    }

    public class TestApplicationOptions : ApplicationOptions<TestTurnState, TestTurnStateManager> { }
}
