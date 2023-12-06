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
        Complete,

        /// <summary>
        /// Error occurred during sign-in
        /// </summary>
        Error
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
        /// The exception object. Only available when sign-in status is Error.
        /// </summary>
        public Exception? Error { get; set; }

        /// <summary>
        /// The cause of error. Only available when sign-in status is Error.
        /// </summary>
        public AuthExceptionReason? Cause { get; set; }

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
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The authentication token if user is signed in. Otherwise returns null. In that case the bot will attempt to sign the user in.</returns>
        Task<string?> SignInUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default);

        /// <summary>
        /// Signs out a user.
        /// </summary>
        /// <param name="context">Current turn context.</param>
        /// <param name="state">Application state.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default);

        /// <summary>
        /// Initialize the authentication class
        /// </summary>
        /// <param name="app">The application object</param>
        /// <param name="name">The name of the authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
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
        IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, AuthException, Task> handler);

        /// <summary>
        /// Check if the user is signed, if they are then return the token.
        /// </summary>
        /// <param name="turnContext">The turn context.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The token if the user is signed. Otherwise null.</returns>
        Task<string?> IsUserSignedInAsync(ITurnContext turnContext, CancellationToken cancellationToken = default);
    }
}
