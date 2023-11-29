using Microsoft.Bot.Builder;
using Microsoft.Identity.Client;
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
        private TeamsSsoBotAuthentication<TState> _botAuth;
        private TeamsSsoMessageExtensionsAuthentication _messageExtensionsAuth;
        private TeamsSsoAdaptiveCardsAuthentication _adaptiveCardsAuth;
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
            _adaptiveCardsAuth = new TeamsSsoAdaptiveCardsAuthentication();
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public Task<bool> IsValidActivity(ITurnContext context)
        {
            return Task.FromResult(_botAuth.IsValidActivity(context)
                || _messageExtensionsAuth.IsValidActivity(context)
                || _adaptiveCardsAuth.IsValidActivity(context));
        }

        /// <summary>
        /// Sign in current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> SignInUser(ITurnContext context, TState state)
        {
            string token = await TryGetUserToken(context);
            if (!string.IsNullOrEmpty(token))
            {
                return new SignInResponse(SignInStatus.Complete)
                {
                    Token = token
                };
            }

            if (_botAuth.IsValidActivity(context))
            {
                return await _botAuth.AuthenticateAsync(context, state);
            }

            if (_messageExtensionsAuth.IsValidActivity(context))
            {
                return await _messageExtensionsAuth.AuthenticateAsync(context);
            }

            if (_adaptiveCardsAuth.IsValidActivity(context))
            {
                return await _adaptiveCardsAuth.AuthenticateAsync(context);
            }

            throw new TeamsAIException("Incoming activity is not a valid activity to initiate authentication flow.");
        }

        /// <summary>
        /// Sign out current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        public async Task SignOutUser(ITurnContext context, TState state)
        {
            string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
            IAccount account = await _settings.MSAL.GetAccountAsync(homeAccountId);
            if (account != null)
            {
                await _settings.MSAL.RemoveAsync(account);
            }
        }

        /// <summary>
        /// The handler function is called when the user has successfully signed in
        /// </summary>
        /// <param name="handler">The handler function to call when the user has successfully signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            _botAuth.OnUserSignInSuccess(handler);
            return this;
        }

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        /// <returns>The class itself for chaining purpose</returns>
        public IAuthentication<TState> OnUserSignInFailure(Func<ITurnContext, TState, TeamsAIAuthException, Task> handler)
        {
            _botAuth.OnUserSignInFailure(handler);
            return this;
        }

        private async Task<string> TryGetUserToken(ITurnContext context)
        {
            string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
            IAccount account = await _settings.MSAL.GetAccountAsync(homeAccountId);
            if (account != null)
            {
                AuthenticationResult result = await _settings.MSAL.AcquireTokenSilent(_settings.Scopes, account).ExecuteAsync();
                return result.AccessToken;
            }
            return ""; // Return empty indication no token found in cache
        }
    }
}
