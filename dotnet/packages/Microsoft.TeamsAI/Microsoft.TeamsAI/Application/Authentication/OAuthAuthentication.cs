using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;
using System.Runtime.CompilerServices;

[assembly: InternalsVisibleTo("Microsoft.Teams.AI.Tests")]
namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication using OAuth Connection.
    /// </summary>
    public class OAuthAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        private readonly OAuthSettings _settings;
        private readonly OAuthMessageExtensionsAuthentication? _messageExtensionAuth;
        private readonly OAuthBotAuthentication<TState>? _botAuthentication;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="app">The application.</param>
        /// <param name="name">The authentication name.</param>
        /// <param name="settings">The settings to initialize the class</param>
        /// <param name="storage">The storage to use.</param>
        public OAuthAuthentication(Application<TState> app, string name, OAuthSettings settings, IStorage? storage) : this(settings, new OAuthMessageExtensionsAuthentication(settings), new OAuthBotAuthentication<TState>(app, settings, name, storage))
        {
        }

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="settings">The settings to initialize the class</param>
        /// <param name="botAuthentication">The bot authentication instance</param>
        /// <param name="messageExtensionAuth">The message extension authentication instance</param>
        internal OAuthAuthentication(OAuthSettings settings, OAuthMessageExtensionsAuthentication messageExtensionAuth, OAuthBotAuthentication<TState> botAuthentication)
        {
            _settings = settings;
            _messageExtensionAuth = messageExtensionAuth;
            _botAuthentication = botAuthentication;
        }

        /// <summary>
        /// Check if the user is signed, if they are then return the token.
        /// </summary>
        /// <param name="turnContext">The turn context.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The token if the user is signed. Otherwise null.</returns>
        public async Task<string?> IsUserSignedInAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            TokenResponse tokenResponse = await GetUserToken(turnContext, _settings.ConnectionName, cancellationToken);

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

        /// <summary>
        /// Get user token
        /// </summary>
        protected virtual async Task<TokenResponse> GetUserToken(ITurnContext context, string connectionName, CancellationToken cancellationToken = default)
        {
            return await UserTokenClientWrapper.GetUserTokenAsync(context, connectionName, "", cancellationToken);
        }
    }
}
