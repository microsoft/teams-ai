﻿using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Schema.Teams;
using Newtonsoft.Json.Linq;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Base class for message extension authentication that handles common logic
    /// </summary>
    internal abstract class MessageExtensionsAuthenticationBase
    {
        /// <summary>
        /// Authenticate current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>The sign in response</returns>
        public async Task<string?> AuthenticateAsync(ITurnContext context, CancellationToken cancellationToken = default)
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
                            return tokenExchangeResponse.Token;
                        }
                    }
                    catch (Exception ex)
                    {
                        // Ignore Exceptions
                        Console.WriteLine($"tokenExchange error: {ex.Message}");
                    }


                    // Token exchange failed, asks user to sign in and consent.
                    Activity activity = new()
                    {
                        Type = ActivityTypesEx.InvokeResponse,
                        Value = new InvokeResponse
                        {
                            Status = 412
                        }
                    };
                    await context.SendActivityAsync(activity);

                    return null;
                }
            }

            JToken? state = value["state"];

            if (state != null && int.TryParse(state.ToString(), out _))
            {
                try
                {
                    TokenResponse tokenResponse = await HandleUserSignIn(context, state.ToString());
                    if (!string.IsNullOrEmpty(tokenResponse.Token))
                    {
                        return tokenResponse.Token;
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
            string authType = IsSsoSignIn(context) ? "silentAuth" : "auth";

            MessagingExtensionResponse response = new()
            {
                ComposeExtension = new MessagingExtensionResult
                {
                    Type = authType,
                    SuggestedActions = new MessagingExtensionSuggestedAction
                    {
                        Actions = new List<CardAction>
                                {
                                    new() {
                                        Type = ActionTypes.OpenUrl,
                                        Value = signInLink,
                                        Title = "Bot Service OAuth",
                                    },
                                },
                    },
                },
            };

            await context.SendActivityAsync(ActivityUtilities.CreateInvokeResponseActivity(response), cancellationToken);

            return null;
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public virtual bool IsValidActivity(ITurnContext context)
        {
            return context.Activity.Type == ActivityTypes.Invoke
                && (context.Activity.Name == MessageExtensionsInvokeNames.QUERY_INVOKE_NAME
                    || context.Activity.Name == MessageExtensionsInvokeNames.FETCH_TASK_INVOKE_NAME
                    || context.Activity.Name == MessageExtensionsInvokeNames.QUERY_LINK_INVOKE_NAME
                    || context.Activity.Name == MessageExtensionsInvokeNames.ANONYMOUS_QUERY_LINK_INVOKE_NAME);
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
        public abstract Task<TokenResponse> HandleUserSignIn(ITurnContext context, string magicCode);

        /// <summary>
        /// Gets the sign in link for the user.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>The sign in link</returns>
        public abstract Task<string> GetSignInLink(ITurnContext context);

        /// <summary>
        /// Should sign in using SSO flow.
        /// </summary>
        /// <param name="context">The turn context.</param>
        /// <returns>A boolean indicating if the sign-in should use SSO flow.</returns>
        public abstract bool IsSsoSignIn(ITurnContext context);
    }
}
