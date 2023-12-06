using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using System.Net;
using Newtonsoft.Json.Linq;
using Microsoft.Identity.Client;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI
{
    internal class TeamsSsoPrompt : Dialog
    {
        private const string _expiresKey = "expires";
        private string _name;
        private TeamsSsoSettings _settings;

        public TeamsSsoPrompt(string dialogId, string name, TeamsSsoSettings settings)
            : base(dialogId)
        {
            this._name = name;
            this._settings = settings;
        }

        public override async Task<DialogTurnResult> BeginDialogAsync(DialogContext dc, object options, CancellationToken cancellationToken)
        {
            int timeout = _settings.Timeout;

            IDictionary<string, object> state = dc.ActiveDialog.State;
            state[_expiresKey] = DateTime.Now.AddMilliseconds(timeout);

            AuthenticationResult? token = await this.TryGetUserToken(dc.Context);
            if (token != null)
            {
                TokenResponse tokenResponse = new()
                {
                    ConnectionName = "", // No connection name is available in this implementation
                    Token = token.AccessToken,
                    Expiration = token.ExpiresOn.ToString("o")
                };
                return await dc.EndDialogAsync(tokenResponse);
            }

            // Cannot get token from cache, send OAuth card to get SSO token
            await this.SendOAuthCardToObtainTokenAsync(dc.Context, cancellationToken);
            return EndOfTurn;
        }

        public override async Task<DialogTurnResult> ContinueDialogAsync(DialogContext dc, CancellationToken cancellationToken = default)
        {
            // Check for timeout
            IDictionary<string, object> state = dc.ActiveDialog.State;
            bool isMessage = (dc.Context.Activity.Type == ActivityTypes.Message);
            bool isTimeoutActivityType =
              isMessage ||
              IsTeamsVerificationInvoke(dc.Context) ||
              IsTokenExchangeRequestInvoke(dc.Context);

            // If the incoming Activity is a message, or an Activity Type normally handled by TeamsBotSsoPrompt,
            // check to see if this TeamsBotSsoPrompt Expiration has elapsed, and end the dialog if so.
            bool hasTimedOut = isTimeoutActivityType && DateTime.Compare(DateTime.UtcNow, (DateTime)state[_expiresKey]) > 0;
            if (hasTimedOut)
            {
                return await dc.EndDialogAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
            }
            else
            {
                if (IsTeamsVerificationInvoke(dc.Context) || IsTokenExchangeRequestInvoke(dc.Context))
                {
                    // Recognize token
                    PromptRecognizerResult<TokenResponse> recognized = await RecognizeTokenAsync(dc, cancellationToken).ConfigureAwait(false);

                    if (recognized.Succeeded)
                    {
                        return await dc.EndDialogAsync(recognized.Value, cancellationToken).ConfigureAwait(false);
                    }
                }
                else if (isMessage && _settings.EndOnInvalidMessage)
                {
                    return await dc.EndDialogAsync(cancellationToken: cancellationToken).ConfigureAwait(false);
                }

                return EndOfTurn;
            }
        }

        private async Task<PromptRecognizerResult<TokenResponse>> RecognizeTokenAsync(DialogContext dc, CancellationToken cancellationToken)
        {

            ITurnContext context = dc.Context;
            PromptRecognizerResult<TokenResponse> result = new();
            TokenResponse? tokenResponse = null;

            if (IsTokenExchangeRequestInvoke(context))
            {
                JObject? tokenResponseObject = context.Activity.Value as JObject;
                string? ssoToken = tokenResponseObject?.ToObject<TokenExchangeInvokeRequest>()?.Token;
                // Received activity is not a token exchange request
                if (string.IsNullOrEmpty(ssoToken))
                {
                    string warningMsg =
                      "The bot received an InvokeActivity that is missing a TokenExchangeInvokeRequest value. This is required to be sent with the InvokeActivity.";
                    await SendInvokeResponseAsync(context, HttpStatusCode.BadRequest, warningMsg, cancellationToken).ConfigureAwait(false);
                }
                else
                {
                    try
                    {
                        string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
                        AuthenticationResult exchangedToken = await ((ILongRunningWebApi)_settings.MSAL).InitiateLongRunningProcessInWebApi(
                                _settings.Scopes,
                                ssoToken,
                                ref homeAccountId
                            ).ExecuteAsync();

                        tokenResponse = new TokenResponse
                        {
                            Token = exchangedToken.AccessToken,
                            Expiration = exchangedToken.ExpiresOn.ToString("o")
                        };

                        await SendInvokeResponseAsync(context, HttpStatusCode.OK, null, cancellationToken).ConfigureAwait(false);
                    }
                    catch (MsalUiRequiredException) // Need user interaction
                    {
                        string warningMsg = "The bot is unable to exchange token. Ask for user consent first.";
                        await SendInvokeResponseAsync(context, HttpStatusCode.PreconditionFailed, new TokenExchangeInvokeResponse
                        {
                            Id = context.Activity.Id,
                            FailureDetail = warningMsg,
                        }, cancellationToken).ConfigureAwait(false);
                    }
                    catch (Exception ex)
                    {
                        string message = $"Failed to get access token with error: {ex.Message}";
                        throw new AuthException(message);
                    }
                }
            }
            else if (IsTeamsVerificationInvoke(context))
            {
                await SendOAuthCardToObtainTokenAsync(context, cancellationToken).ConfigureAwait(false);
                await SendInvokeResponseAsync(context, HttpStatusCode.OK, null, cancellationToken).ConfigureAwait(false);
            }

            if (tokenResponse != null)
            {
                result.Succeeded = true;
                result.Value = tokenResponse;
            }
            else
            {
                result.Succeeded = false;
            }
            return result;
        }

        private async Task SendOAuthCardToObtainTokenAsync(ITurnContext context, CancellationToken cancellationToken)
        {
            SignInResource signInResource = GetSignInResource();

            // Ensure prompt initialized
            IMessageActivity prompt = Activity.CreateMessageActivity();
            prompt.Attachments = new List<Attachment>();
            prompt.Attachments.Add(new Attachment
            {
                ContentType = OAuthCard.ContentType,
                Content = new OAuthCard
                {
                    Text = "Sign In",
                    Buttons = new[]
                    {
                            new CardAction
                            {
                                    Title = "Teams SSO Sign In",
                                    Value = signInResource.SignInLink,
                                    Type = ActionTypes.Signin,
                            },
                        },
                    TokenExchangeResource = signInResource.TokenExchangeResource,
                },
            });
            // Send prompt
            await context.SendActivityAsync(prompt, cancellationToken).ConfigureAwait(false);
        }

        private SignInResource GetSignInResource()
        {
            string signInLink = $"{_settings.SignInLink}?scope={Uri.EscapeDataString(string.Join(" ", _settings.Scopes))}&clientId={_settings.MSAL.AppConfig.ClientId}&tenantId={_settings.MSAL.AppConfig.TenantId}";

            SignInResource signInResource = new()
            {
                SignInLink = signInLink,
                TokenExchangeResource = new TokenExchangeResource
                {
                    Id = $"{Guid.NewGuid()}-{_name}"
                }
            };

            return signInResource;
        }

        private async Task<AuthenticationResult?> TryGetUserToken(ITurnContext context)
        {
            string homeAccountId = $"{context.Activity.From.AadObjectId}.{context.Activity.Conversation.TenantId}";
            IAccount account = await this._settings.MSAL.GetAccountAsync(homeAccountId);
            if (account != null)
            {
                AuthenticationResult result = await this._settings.MSAL.AcquireTokenSilent(this._settings.Scopes, account).ExecuteAsync();
                return result;
            }
            return null; // Return empty indication no token found in cache
        }

        private bool IsTeamsVerificationInvoke(ITurnContext context)
        {
            return (context.Activity.Type == ActivityTypes.Invoke) && (context.Activity.Name == SignInConstants.VerifyStateOperationName);
        }
        private bool IsTokenExchangeRequestInvoke(ITurnContext context)
        {
            return (context.Activity.Type == ActivityTypes.Invoke) && (context.Activity.Name == SignInConstants.TokenExchangeOperationName);
        }

        private static async Task SendInvokeResponseAsync(ITurnContext turnContext, HttpStatusCode statusCode, object? body, CancellationToken cancellationToken)
        {
            await turnContext.SendActivityAsync(
                new Activity
                {
                    Type = ActivityTypesEx.InvokeResponse,
                    Value = new InvokeResponse
                    {
                        Status = (int)statusCode,
                        Body = body,
                    },
                }, cancellationToken).ConfigureAwait(false);
        }
    }
}
