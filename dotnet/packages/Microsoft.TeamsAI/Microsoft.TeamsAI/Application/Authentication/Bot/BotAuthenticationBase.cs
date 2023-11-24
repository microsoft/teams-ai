using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application.Authentication.Bot
{
    /// <summary>
    /// Base class for bot authentication that handles common logic
    /// </summary>
    public abstract class BotAuthenticationBase
    {
        /// <summary>
        /// Authenticate current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> Authenticate(ITurnContext context, TurnState state)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public bool IsValidActivity(ITurnContext context)
        {
            return context.Activity.Type == ActivityTypes.Message
                && !string.IsNullOrEmpty(context.Activity.Text);
        }
    }
}
