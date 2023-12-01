using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication using OAuth Connection.
    /// </summary>
    public class OAuthAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        private OAuthPromptSettings _settings;
        private OAuthMessageExtensionsAuthentication? _messageExtensionAuth;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="settings">The settings to initialize the class</param>
        public OAuthAuthentication(OAuthPromptSettings settings)
        {
            _settings = settings;
        }

        /// <summary>
        /// Initialize the authentication class
        /// </summary>
        /// <param name="app">The application object</param>
        /// <param name="name">The name of the authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        public void Initialize(Application<TState> app, string name, IStorage? storage = null)
        {
            _messageExtensionAuth = new OAuthMessageExtensionsAuthentication(_settings.ConnectionName);
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public Task<bool> IsValidActivityAsync(ITurnContext context)
        {
            return Task.FromResult(_messageExtensionAuth != null && _messageExtensionAuth.IsValidActivity(context));
        }

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, TeamsAIAuthException, Task> handler)
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
        public async Task<SignInResponse> SignInUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            TokenResponse tokenResponse = await UserTokenClientWrapper.GetUserTokenAsync(context, _settings.ConnectionName, "", cancellationToken);
            if (tokenResponse != null && !string.IsNullOrEmpty(tokenResponse.Token))
            {
                return new SignInResponse(SignInStatus.Complete)
                {
                    Token = tokenResponse.Token
                };
            }

            if ((_messageExtensionAuth != null && _messageExtensionAuth.IsValidActivity(context)))
            {
                return await _messageExtensionAuth.AuthenticateAsync(context);
            }

            throw new TeamsAIException("Incoming activity is not a valid activity to initiate authentication flow.");
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="cancellationToken">The cancellation token</param>
        public async Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            await UserTokenClientWrapper.SignoutUserAsync(context, _settings.ConnectionName, cancellationToken);
        }
    }
}
