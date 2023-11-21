
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestApplication : Application<TurnState>
    {
        public TestApplication(TestApplicationOptions options) : base(options)
        {
            ArgumentNullException.ThrowIfNull(options);

            options.StartTypingTimer = false;
        }
    }

    public class TestApplicationOptions : ApplicationOptions<TurnState> { }
}
