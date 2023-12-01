using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication using OAuth Connection.
    /// </summary>
    internal class OAuthAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        /// <summary>
        /// Initialize the authentication class
        /// </summary>
        /// <param name="app">The application object</param>
        /// <param name="name">The name of the authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        public void Initialize(Application<TState> app, string name, IStorage? storage = null)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Check if the user is signed, if they are then return the token.
        /// </summary>
        /// <param name="turnContext">The turn context.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The token if the user is signed. Otherwise null.</returns>
        public Task<string?> IsUserSignedInAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public Task<bool> IsValidActivityAsync(ITurnContext context)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, AuthException, Task> handler)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// The handler function is called when the user has successfully signed in
        /// </summary>
        /// <param name="handler">The handler function to call when the user has successfully signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Sign in current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The sign in response</returns>
        public Task<SignInResponse> SignInUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="cancellationToken">The cancellation token</param>
        public Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            throw new NotImplementedException();
        }
    }
}
