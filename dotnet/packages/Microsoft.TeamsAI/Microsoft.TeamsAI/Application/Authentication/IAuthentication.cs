using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Exceptions;
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

        /// <summary>
        /// Initialize an instance of current class
        /// </summary>
        /// <param name="status">The sign in status</param>
        public SignInResponse(SignInStatus status)
        {
            this.Status = status;
        }
    }

    /// <summary>
    /// Handles user sign-in and sign-out.
    /// </summary>
    public interface IAuthentication<TState>
        where TState : TurnState, new()
    {
        /// <summary>
        /// Signs in a user.
        /// This method will be called automatically by the Application class.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="state">Application state.</param>
        /// <returns>The authentication token if user is signed in.</returns>
        Task<SignInResponse> SignInUser(ITurnContext context, TState state);

        /// <summary>
        /// Signs out a user.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="state">Application state.</param>
        Task SignOutUser(ITurnContext context, TState state);

        /// <summary>
        /// Check whether current activity supports authentication.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <returns>True if current activity supports authentication. Otherwise, false.</returns>
        Task<bool> IsValidActivity(ITurnContext context);

        /// <summary>
        /// Initialize the authentication class
        /// </summary>
        /// <param name="app">The application object</param>
        /// <param name="name">The name of the authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        /// 
        void Initialize(Application<TState> app, string name, IStorage? storage = null);

        /// <summary>
        /// The handler function is called when the user has successfully signed in
        /// </summary>
        /// <param name="handler">The handler function to call when the user has successfully signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler);

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, TeamsAIAuthException, Task> handler);
    }
}
