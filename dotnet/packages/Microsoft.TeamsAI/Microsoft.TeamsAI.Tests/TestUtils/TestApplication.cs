
namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestApplication : Application<TestTurnState, TestTurnStateManager>
    {
        public TestApplication(TestApplicationOptions options) : base(options)
        {
            ArgumentNullException.ThrowIfNull(options);

            options.StartTypingTimer = false;
        }
    }

    public class TestApplicationOptions : ApplicationOptions<TestTurnState, TestTurnStateManager> { }
}
