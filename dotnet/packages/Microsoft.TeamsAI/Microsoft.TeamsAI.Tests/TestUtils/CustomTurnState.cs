using Microsoft.TeamsAI.State;

namespace Microsoft.TeamsAI.Tests.TestUtils
{
    public class CustomTurnState : TurnState<CustomConversationState, CustomUserState, CustomTempState>
    {
    }

    public class CustomConversationState : StateBase
    {
    }

    public class CustomUserState : StateBase
    {
    }

    public class CustomTempState : TempState
    {
    }
}
