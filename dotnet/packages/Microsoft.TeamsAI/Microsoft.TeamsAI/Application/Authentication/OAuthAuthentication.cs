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
        private OAuthBotAuthentication<TState>? _botAuthentication;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="settings">The settings to initialize the class</param>
        public OAuthAuthentication(OAuthSettings settings)
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
            _botAuthentication = new OAuthBotAuthentication<TState>(app, _settings, name, storage);
        }

        /// <summary>
        /// Check if the user is signed, if they are then return the token.
        /// </summary>
        /// <param name="turnContext">The turn context.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The token if the user is signed. Otherwise null.</returns>
        public async Task<string?> IsUserSignedInAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            TokenResponse tokenResponse = await UserTokenClientWrapper.GetUserTokenAsync(turnContext, _settings.ConnectionName, "", cancellationToken);

            if (tokenResponse != null && tokenResponse.Token != string.Empty)
            {
                return tokenResponse.Token;
            }

            return null;
        }

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, AuthException, Task> handler)
        {
            if (_botAuthentication == null)
            {
                throw new TeamsAIException("Bot authentication is not initialized.");
            }

            _botAuthentication.OnUserSignInFailure(handler);
            return this;
        }

        /// <summary>
        /// The handler function is called when the user has successfully signed in
        /// </summary>
        /// <param name="handler">The handler function to call when the user has successfully signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            if (_botAuthentication == null)
            {
                throw new TeamsAIException("Bot authentication is not initialized.");
            }

            _botAuthentication.OnUserSignInSuccess(handler);
            return this;
        }

        /// <summary>
        /// Sign in current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The sign in response</returns>
        public async Task<string?> SignInUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            TokenResponse tokenResponse = await UserTokenClientWrapper.GetUserTokenAsync(context, _settings.ConnectionName, "", cancellationToken);
            if (tokenResponse != null && !string.IsNullOrEmpty(tokenResponse.Token))
            {
                return tokenResponse.Token;
            }

            if ((_messageExtensionAuth != null && _messageExtensionAuth.IsValidActivity(context)))
            {
                return await _messageExtensionAuth.AuthenticateAsync(context);
            }

            if ((_botAuthentication != null && _botAuthentication.IsValidActivity(context)))
            {
                return await _botAuthentication.AuthenticateAsync(context, state, cancellationToken);
            }

            throw new AuthException("Incoming activity is not a valid activity to initiate authentication flow.", AuthExceptionReason.InvalidActivity);
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="cancellationToken">The cancellation token</param>
        public async Task SignOutUserAsync(ITurnContext context, TState state, CancellationToken cancellationToken = default)
        {
            _botAuthentication?.DeleteAuthFlowState(context, state);

            await UserTokenClientWrapper.SignoutUserAsync(context, _settings.ConnectionName, cancellationToken);
        }
    }
}
