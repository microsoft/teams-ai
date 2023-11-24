using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace ListBot.Model
{
    public class ListState : TurnState
    {
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

        /// <summary>
        /// Compute default values for each scope. If not set then <see cref="Record"/> will be used by default.
        /// </summary>
        /// <param name="context">The turn context.</param>
        /// <returns>The default values for each scope.</returns>
        protected override Dictionary<string, Record> OnComputeScopeDefaults(ITurnContext context)
        {
            Dictionary<string, Record> defaults = base.OnComputeScopeDefaults(context);
            defaults[CONVERSATION_SCOPE] = new ConversationState();
            return defaults;
        }
    }

    public class ConversationState : Record
    {
        public bool Greeted
        {
            get => Get<bool>("greeted");
            set => Set("greeted", value);
        }

        public Dictionary<string, IList<string>> Lists
        {
            get => Get<Dictionary<string, IList<string>>>("lists") ?? new();
            set => Set("lists", value);
        }
    }
}
