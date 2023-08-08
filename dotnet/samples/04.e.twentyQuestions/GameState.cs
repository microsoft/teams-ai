using Microsoft.TeamsAI.State;

namespace TwentyQuestions
{
    /// <summary>
    /// Extend the turn state by configuring custom strongly typed state classes.
    /// </summary>
    public class GameState : TurnState<ConversationState, StateBase, TempState>
    {
    }

    /// <summary>
    /// This class adds custom properties to the turn state which will be accessible in the activity handler methods.
    /// </summary>
    public class ConversationState : StateBase
    {
        private const string _secretWordKey = "secretWordKey";
        private const string _guessCountKey = "guessCountKey";
        private const string _remainingGuessesKey = "remainingGuessesKey";

        public string? SecretWord
        {
            get => Get<string>(_secretWordKey);
            set => Set(_secretWordKey, value);
        }

        public int GuessCount
        {
            get => Get<int>(_guessCountKey);
            set => Set(_guessCountKey, value);
        }

        public int RemainingGuesses
        {
            get => Get<int>(_remainingGuessesKey);
            set => Set(_remainingGuessesKey, value);
        }
    }
}
