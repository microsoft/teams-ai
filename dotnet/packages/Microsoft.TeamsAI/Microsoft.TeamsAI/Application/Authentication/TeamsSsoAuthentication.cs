using Microsoft.Bot.Builder;
using Microsoft.Identity.Client;
using Microsoft.Teams.AI.Application.Authentication.AdaptiveCards;
using Microsoft.Teams.AI.Application.Authentication.Bot;
using Microsoft.Teams.AI.Application.Authentication.MessageExtensions;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI.Application.Authentication
{
    /// <summary>
    /// Handles authentication based on Teams SSO.
    /// </summary>
    public class TeamsSsoAuthentication<TState> : IAuthentication<TState>
        where TState : TurnState, new()
    {
        private readonly string[] _scopes;
        private readonly TeamsSsoBotAuthentication<TState> _botAuth;
        private readonly TeamsSsoMessageExtensionsAuthentication _messageExtensionsAuth;
        private readonly TeamsSsoAdaptiveCardsAuthentication _adaptiveCardsAuth;
        private readonly IConfidentialClientApplication _msal;

        /// <summary>
        /// Initialize instance for current class
        /// </summary>
        /// <param name="app">The application instance</param>
        /// <param name="name">The name of the authentication handler</param>
        /// <param name="msal">The MSAL instance</param>
        /// <param name="storage">The storage to save turn state</param>
        /// <param name="scopes">The </param>
        public TeamsSsoAuthentication(Application<TState> app, string name, string[] scopes, IConfidentialClientApplication msal, IStorage? storage = null)
        {
            _scopes = scopes;
            _msal = msal;
            _botAuth = new TeamsSsoBotAuthentication<TState>(app, name, storage);
            _messageExtensionsAuth = new TeamsSsoMessageExtensionsAuthentication();
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
                return await _botAuth.Authenticate(context, state);
            }

            if (_messageExtensionsAuth.IsValidActivity(context))
            {
                return await _messageExtensionsAuth.Authenticate(context);
            }

            if (_adaptiveCardsAuth.IsValidActivity(context))
            {
                return await _adaptiveCardsAuth.Authenticate(context);
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
            IAccount account = await _msal.GetAccountAsync(homeAccountId);
            if (account != null)
            {
                await _msal.RemoveAsync(account);
            }
        }

        private async Task<string> TryGetUserToken(ITurnContext context)
        {
            string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
            IAccount account = await _msal.GetAccountAsync(homeAccountId);
            if (account != null)
            {
                AuthenticationResult result = await _msal.AcquireTokenSilent(_scopes, account).ExecuteAsync();
                return result.AccessToken;
            }
            return ""; // Return empty indication no token found in cache
        }
    }
}
