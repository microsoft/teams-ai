using Microsoft.Teams.AI.State;
using Record = Microsoft.Teams.AI.State.Record;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    public class CustomTurnState : TurnState<CustomConversationState, CustomUserState, CustomTempState>
    {
    }

    public class CustomConversationState : Record
    {
    }

    public class CustomUserState : Record
    {
    }

    public class CustomTempState : TempState
    {
    }
}
