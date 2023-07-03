
using Microsoft.Bot.Builder.M365.State;

namespace Microsoft.Bot.Builder.M365.Tests.StateTests
{
    public class TurnStateTests
    {
        [Fact]
        public void Test_Simple()
        {
            TurnState state = new();
        }
    }
}
