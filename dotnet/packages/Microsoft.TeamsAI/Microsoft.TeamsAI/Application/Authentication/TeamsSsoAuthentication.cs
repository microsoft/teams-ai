using Microsoft.Bot.Builder;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Extensibility;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication based on Teams SSO.
    /// </summary>
    public class TeamsSsoAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        private TeamsSsoBotAuthentication<TState>? _botAuth;
        private TeamsSsoMessageExtensionsAuthentication? _messageExtensionsAuth;
        private TeamsSsoSettings _settings;

        /// <summary>
        /// Initialize instance for current class
        /// </summary>
        /// <param name="settings">The settings to initialize the class</param>
        public TeamsSsoAuthentication(TeamsSsoSettings settings)
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
            _botAuth = new TeamsSsoBotAuthentication<TState>(app, name, _settings, storage);
            _messageExtensionsAuth = new TeamsSsoMessageExtensionsAuthentication(_settings);
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public Task<bool> IsValidActivityAsync(ITurnContext context)
        {
            return Task.FromResult(
                (_botAuth != null && _botAuth.IsValidActivity(context))
                || (_messageExtensionsAuth != null && _messageExtensionsAuth.IsValidActivity(context)));
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
            string token = await TryGetUserToken(context);
            if (!string.IsNullOrEmpty(token))
            {
                return new SignInResponse(SignInStatus.Complete)
                {
                    Token = token
                };
            }

            if ((_botAuth != null && _botAuth.IsValidActivity(context)))
            {
                return await _botAuth.AuthenticateAsync(context, state);
            }

            if ((_messageExtensionsAuth != null && _messageExtensionsAuth.IsValidActivity(context)))
            {
                return await _messageExtensionsAuth.AuthenticateAsync(context);
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
            string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";

            ILongRunningWebApi? oboCca = _settings.MSAL as ILongRunningWebApi;
            if (oboCca != null)
            {
                await oboCca.StopLongRunningProcessInWebApiAsync(homeAccountId, cancellationToken);
            }
        }

        /// <summary>
        /// The handler function is called when the user has successfully signed in
        /// </summary>
        /// <param name="handler">The handler function to call when the user has successfully signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            if (_botAuth != null)
            {
                _botAuth.OnUserSignInSuccess(handler);
            }
            return this;
        }

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, TeamsAIAuthException, Task> handler)
        {
            if (_botAuth != null)
            {
                _botAuth.OnUserSignInFailure(handler);
            }
            return this;
        }

        private async Task<string> TryGetUserToken(ITurnContext context)
        {
            string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
            try
            {
                AuthenticationResult result = await ((ILongRunningWebApi)_settings.MSAL).AcquireTokenInLongRunningProcess(
                    _settings.Scopes,
                            homeAccountId
                        ).ExecuteAsync();
                return result.AccessToken;
            }
            catch (MsalClientException)
            {
                // Cannot acquire token from cache
            }

            return ""; // Return empty indication no token found in cache
        }
    }
}
