using Microsoft.TeamsAI.State;

namespace QuestBot.State
{
    /// <summary>
    /// Extend the turn state by configuring custom strongly typed state classes.
    /// </summary>
    public class QuestState : TurnState<QuestConversationState, QuestUserState, QuestTempState>
    {
    }
}
