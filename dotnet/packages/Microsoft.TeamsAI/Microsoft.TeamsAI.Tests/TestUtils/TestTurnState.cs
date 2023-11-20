using Microsoft.Teams.AI.State;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class TestTurnState : TurnState<Record, Record, TempState>
    {
        public TestTurnState() : base() { }
    }
}
