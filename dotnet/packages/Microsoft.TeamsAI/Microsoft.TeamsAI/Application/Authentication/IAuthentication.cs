using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// The sign-in status
    /// </summary>
    public enum SignInStatus
    {
        /// <summary>
        /// Sign-in not complete and requires user interaction
        /// </summary>
        Pending,
        /// <summary>
        /// Sign-in complete
        /// </summary>
        Complete
    }

    /// <summary>
    /// The sign-in response
    /// </summary>
    public class SignInResponse
    {
        /// <summary>
        /// The sign-in status
        /// </summary>
        public SignInStatus Status { get; set; }

        /// <summary>
        /// The access token. Only available when sign-in status is Complete.
        /// </summary>
        public string? Token { get; set; }
    }

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
        Task<SignInResponse> SignInUser(ITurnContext context, TurnState state);

        /// <summary>
        /// Signs out a user.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="state">Application state.</param>
        Task SignOutUser(ITurnContext context, TurnState state);

        /// <summary>
        /// Check whether current activity supports authentication.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <returns>True if current activity supports authentication. Otherwise, false.</returns>
        Task<bool> IsValidActivity(ITurnContext context);
    }
}
