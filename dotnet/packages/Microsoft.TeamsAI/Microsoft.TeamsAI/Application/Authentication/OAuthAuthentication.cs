using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application.Authentication
{
    /// <summary>
    /// Handles authentication using OAuth Connection.
    /// </summary>
    public class OAuthAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public Task<bool> IsValidActivity(ITurnContext context)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Sign in current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <returns>The sign in response</returns>
        public Task<SignInResponse> SignInUser(ITurnContext context, TState state)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        public Task SignOutUser(ITurnContext context, TState state)
        {
            throw new NotImplementedException();
        }
    }
}
