using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application.Authentication
{
    /// <summary>
    /// Handles user sign-in and sign-out.
    /// </summary>
    public interface IAuthentication
    {
        /// <summary>
        /// Signs in a user.
        /// This method will be called automatically by the Application class.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="state">Application state.</param>
        /// <returns>The authentication token if user is signed in.</returns>
        Task<string> SignUserIn(TurnContext context, TurnState state);

        /// <summary>
        /// Signs out a user.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="state">Application state.</param>
        Task SignOutUser(TurnContext context, TurnState state);
    }
}
