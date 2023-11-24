using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Base class for message extension authentication that handles common logic
    /// </summary>
    public abstract class MessageExtensionsAuthenticationBase
    {
        /// <summary>
        /// Authenticate current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> Authenticate(ITurnContext context)
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
                && (context.Activity.Name == MessageExtensionsInvokeNames.QUERY_INVOKE_NAME
                    && context.Activity.Name == MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME
                    && context.Activity.Name == MessageExtensionsInvokeNames.QUERY_LINK_INVOKE_NAME
                    && context.Activity.Name == MessageExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE_NAME);
        }
    }
}
