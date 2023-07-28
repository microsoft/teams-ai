using Microsoft.TeamsAI.State;

namespace DevOpsBot.Model
{
    /// <summary>
    /// Shorter the class name since turn state is strongly typed.
    /// </summary>
    public class DevOpsStateManager : TurnStateManager<DevOpsState, DevOpsConversationState, StateBase, TempState>
    {
    }
}
