using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Base class for message extension authentication that handles common logic
    /// </summary>
    public abstract class MessageExtensionsAuthenticationBase
    {
        /// <summary>
        /// Authenticate current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> AuthenticateAsync(ITurnContext context)
        {
            JObject value = JObject.FromObject(context.Activity.Value);
            JToken? tokenExchangeRequest = value["authentication"];
            // Token Exchange, this happens when a silentAuth action is sent to Teams
            if (tokenExchangeRequest != null)
            {
                JToken? token = tokenExchangeRequest["token"];
                if (token != null)
                {
                    // Message extension token exchange invoke activity
                    try
                    {
                        TokenResponse tokenExchangeResponse = await HandleSsoTokenExchange(context);
                        if (!string.IsNullOrEmpty(tokenExchangeResponse.Token))
                        {
                            return new SignInResponse(SignInStatus.Complete)
                            {
                                Token = tokenExchangeResponse.Token
                            };
                        }
                    }
                    catch (Exception ex)
                    {
                        // Ignore Exceptions
                        Console.WriteLine($"tokenExchange error: {ex.Message}");
                    }


                    // Token exchange failed, asks user to sign in and consent.
                    Activity response = new()
                    {
                        Type = ActivityTypesEx.InvokeResponse,
                        Value = new InvokeResponse
                        {
                            Status = 412
                        }
                    };
                    await context.SendActivityAsync(response);

                    return new SignInResponse(SignInStatus.Pending);
                }
            }

            JToken? state = value["state"];

            if (state != null && int.TryParse(state.ToString(), out _))
            {
                try
                {
                    TokenResponse response = await HandlerUserSignIn(context, state.ToString());
                    if (!string.IsNullOrEmpty(response.Token))
                    {
                        return new SignInResponse(SignInStatus.Complete)
                        {
                            Token = response.Token
                        };
                    }
                }
                catch
                {
                    // Ignore errors when verify magic code
                }
            }

            // No auth/silentAuth action sent to Teams yet
            // Retrieve the OAuth Sign in Link to use in the MessageExtensionResult Suggested Actions

            string signInLink = await GetSignInLink(context);
            // Do 'silentAuth' if this is a composeExtension/query request otherwise do normal `auth` flow.
            string authType = context.Activity.Name == MessageExtensionsInvokeNames.QUERY_INVOKE_NAME ? "silentAuth" : "auth";

            MessagingExtensionResponse resposne = new()
            {
                ComposeExtension = new MessagingExtensionResult
                {
                    Type = authType,
                    SuggestedActions = new MessagingExtensionSuggestedAction
                    {
                        Actions = new List<CardAction>
                                {
                                    new CardAction
                                    {
                                        Type = ActionTypes.OpenUrl,
                                        Value = signInLink,
                                        Title = "Bot Service OAuth",
                                    },
                                },
                    },
                },
            };

            await context.SendActivityAsync(ActivityUtilities.CreateInvokeResponseActivity(resposne));

            return new SignInResponse(SignInStatus.Pending);
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public bool IsValidActivity(ITurnContext context)
        {
            return context.Activity.Type == ActivityTypes.Invoke
                && (context.Activity.Name == MessageExtensionsInvokeNames.QUERY_INVOKE_NAME
                    && context.Activity.Name == MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME
                    && context.Activity.Name == MessageExtensionsInvokeNames.QUERY_LINK_INVOKE_NAME
                    && context.Activity.Name == MessageExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE_NAME);
        }

        /// <summary>
        /// Handles the SSO token exchange.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The token response if token exchange success</returns>
        public abstract Task<TokenResponse> HandleSsoTokenExchange(ITurnContext context);

        /// <summary>
        /// Handles the user sign in.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="magicCode">The magic code from user sign-in.</param>
        /// <returns>The token response if successfully verified the magic code</returns>
        public abstract Task<TokenResponse> HandlerUserSignIn(ITurnContext context, string magicCode);

        /// <summary>
        /// Gets the sign in link for the user.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in link</returns>
        public abstract Task<string> GetSignInLink(ITurnContext context);
    }
}
