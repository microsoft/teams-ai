using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Identity.Client;
using Microsoft.Teams.AI.Exceptions;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication for Message Extensions in Teams using Teams SSO.
    /// </summary>
    internal class TeamsSsoMessageExtensionsAuthentication : MessageExtensionsAuthenticationBase
    {
        protected IConfidentialClientApplicationAdapter _msalAdapter;

        private TeamsSsoSettings _settings;

        public TeamsSsoMessageExtensionsAuthentication(TeamsSsoSettings settings)
        {
            _settings = settings;
            _msalAdapter = new ConfidentialClientApplicationAdapter(settings.MSAL);
        }


        /// <summary>
        /// Gets the sign in link for the user.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in link</returns>
        public override Task<string> GetSignInLink(ITurnContext context)
        {
            string signInLink = $"{_settings.SignInLink}?scope={Uri.EscapeDataString(string.Join(" ", _settings.Scopes))}&clientId={_msalAdapter.AppConfig.ClientId}&tenantId={_msalAdapter.AppConfig.TenantId}";

            return Task.FromResult(signInLink);
        }

        /// <summary>
        /// Handles the user sign in.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="magicCode">The magic code from user sign-in.</param>
        /// <returns>The token response if successfully verified the magic code</returns>
        public override Task<TokenResponse> HandleUserSignIn(ITurnContext context, string magicCode)
        {
            // Return empty token response to tirgger silentAuth again
            return Task.FromResult(new TokenResponse());
        }

        /// <summary>
        /// Handles the SSO token exchange.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The token response if token exchange success</returns>
        public override async Task<TokenResponse> HandleSsoTokenExchange(ITurnContext context)
        {
            JObject value = JObject.FromObject(context.Activity.Value);
            JToken? tokenExchangeRequest = value["authentication"];
            JToken? token = tokenExchangeRequest?["token"];
            if (token != null)
            {
                try
                {
                    string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
                    AuthenticationResult result = await _msalAdapter.InitiateLongRunningProcessInWebApi(_settings.Scopes, token.ToString(), ref homeAccountId);

                    return new TokenResponse()
                    {
                        Token = result.AccessToken,
                        Expiration = result.ExpiresOn.ToString("O")
                    };
                }
                catch (MsalUiRequiredException)
                {
                    // Requires user consent, ignore this exception
                }
                catch (Exception ex)
                {
                    string message = $"Failed to exchange access token with error: {ex.Message}";
                    throw new AuthException(message);
                }
            }

            return new TokenResponse();
        }

        public override bool IsSsoSignIn(ITurnContext context)
        {
            return context.Activity.Name == MessageExtensionsInvokeNames.QUERY_INVOKE_NAME;
        }

        public override bool IsValidActivity(ITurnContext context)
        {
            return base.IsValidActivity(context)
                && context.Activity.Name == MessageExtensionsInvokeNames.QUERY_INVOKE_NAME;
        }
    }
}
