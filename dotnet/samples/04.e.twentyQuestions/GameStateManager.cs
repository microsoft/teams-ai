using Microsoft.TeamsAI.State;

namespace TwentyQuestions
{
    /// <summary>
    /// Shorter the class name since turn state is strongly typed.
    /// </summary>
    public class GameStateManager : TurnStateManager<GameState, ConversationState, StateBase, TempState> { }
}
