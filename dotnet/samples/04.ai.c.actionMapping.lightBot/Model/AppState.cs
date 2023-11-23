using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace LightBot.Model
{
    // Extend the turn state by configuring custom strongly typed state classes.
    public class AppState : TurnState
    {
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

    // This class adds custom properties to the turn state which will be accessible in the various handler methods.
    public class ConversationState : Record
    {
        public bool LightsOn
        {
            get => Get<bool>("lightsOn");
            set => Set("lightsOn", value);
        }
    }
}
