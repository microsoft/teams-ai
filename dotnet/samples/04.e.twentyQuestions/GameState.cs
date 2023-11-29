using Microsoft.Teams.AI.State;

namespace TwentyQuestions
{
    /// <summary>
    /// Extend the turn state by configuring custom strongly typed state classes.
    /// </summary>
    public class GameState : TurnState
    {
        public GameState()
        {
            ScopeDefaults[CONVERSATION_SCOPE] = new ConversationState();
        }

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public new ConversationState Conversation
        {
            get
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (ConversationState)scope.Value!;
            }
            set
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);

                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }
    }

    /// <summary>
    /// This class adds custom properties to the turn state which will be accessible in the activity handler methods.
    /// </summary>
    public class ConversationState : Record
    {
        // The keys can be referenced in the prompt using the ${{conversation.<key>}} syntax.
        // For example, ${{conversation.secretWord}}
        private const string _secretWordKey = "secretWord";
        private const string _guessCountKey = "guessCount";
        private const string _remainingGuessesKey = "remainingGuesses";

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
