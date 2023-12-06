using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Base class for adaptive card authentication that handles common logic
    /// </summary>
    internal abstract class AdaptiveCardsAuthenticationBase
    {
        /// <summary>
        /// Authenticate current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> AuthenticateAsync(ITurnContext context)
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
            return context.Activity.Type == ActivityTypes.Invoke
                && context.Activity.Name == AdaptiveCardsInvokeNames.ACTION_INVOKE_NAME;
        }
    }
}
