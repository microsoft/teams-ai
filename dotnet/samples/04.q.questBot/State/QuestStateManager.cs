using Microsoft.Teams.AI.State;

namespace QuestBot.State
{
    /// <summary>
    /// Shorter the class name since turn state is strongly typed.
    /// </summary>
    public class QuestStateManager : TurnStateManager<QuestState, QuestConversationState, QuestUserState, QuestTempState>
    {
    }
}
