using Microsoft.TeamsAI.State;

namespace TwentyQuestions
{
    /// <summary>
    /// Strongly type the turn state
    /// </summary>
    public class GameTurnState : TurnState
    {
        public string? SecretWord
        {
            get
            {
                Conversation!.TryGetValue("SecretWord", out string value);
                return value;
            }
            set
            {
                Conversation!.Set("SecretWord", value);
            }
        }

        public int GuessCount
        {
            get
            {
                Conversation!.TryGetValue("GuessCount", out int value);
                return value;
            }
            set
            {
                Conversation!.Set("GuessCount", value);
            }
        }

        public int RemainingGuesses
        {
            get
            {
                Conversation!.TryGetValue("RemainingGuesses", out int value);
                return value;
            }
            set
            {
                Conversation!.Set("RemainingGuesses", value);
            }
        }
    }
}
