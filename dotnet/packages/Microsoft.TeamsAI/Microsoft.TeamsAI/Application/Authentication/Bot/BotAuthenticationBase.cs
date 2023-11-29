using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Base class for bot authentication that handles common logic
    /// </summary>
    public abstract class BotAuthenticationBase<TState>
        where TState : TurnState, new()
    {
        /// <summary>
        /// Name of the authentication handler
        /// </summary>
        protected string _name;

        /// <summary>
        /// Storage to save turn state
        /// </summary>
        protected IStorage _storage;

        /// <summary>
        /// Callback when user sign in success
        /// </summary>
        protected Func<ITurnContext, TState, Task>? _userSignInSuccessHandler;

        /// <summary>
        /// Callback when user sign in fail
        /// </summary>
        protected Func<ITurnContext, TState, TeamsAIAuthException, Task>? _userSignInFailureHandler;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="app">The application instance</param>
        /// <param name="name">The name of authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        public BotAuthenticationBase(Application<TState> app, string name, IStorage? storage = null)
        {
            _name = name;
            _storage = storage ?? new MemoryStorage();

            // Add application routes to handle OAuth callbacks
            app.AddRoute(this.VerifyStateRouteSelector, async (context, state, cancellationToken) =>
            {
                await this.HandleSignInActivity(context, state, cancellationToken);
            });

            app.AddRoute(this.TokenExchangeRouteSelector, async (context, state, cancellationToken) =>
            {
                await this.HandleSignInActivity(context, state, cancellationToken);
            });
        }

        /// <summary>
        /// Authenticate current user
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <returns>The sign in response</returns>
        public async Task<SignInResponse> AuthenticateAsync(ITurnContext context, TState state)
        {
            // Get property names to use
            string userAuthStatePropertyName = GetUserAuthStatePropertyName(context);
            string userDialogStatePropertyName = GetUserDialogStatePropertyName(context);

            // Save message if not signed in
            if (!TryGetUserAuthState(context, state, out _))
            {
                state.Conversation.Add(userAuthStatePropertyName, new Dictionary<string, string>()
                {
                    {"message", context.Activity.Text }
                });
            }

            DialogTurnResult result = await RunDialog(context, state, userDialogStatePropertyName);
            if (result.Status == DialogTurnStatus.Complete)
            {
                // Delete user auth state
                DeleteAuthFlowState(context, state);
                TokenResponse? tokenResponse = result.Result as TokenResponse;
                if (tokenResponse == null)
                {
                    // Completed dialog without a token.
                    // This could mean the user declined the consent prompt in the previous turn.
                    // Retry authentication flow again.
                    return await AuthenticateAsync(context, state);
                }
                else
                {
                    // Return token
                    return new SignInResponse(SignInStatus.Complete)
                    {
                        Token = tokenResponse.Token
                    };
                }
            }

            return new SignInResponse(SignInStatus.Pending);
        }

        /// <summary>
        /// Whether the current activity is a valid activity that supports authentication
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <returns>True if valid. Otherwise, false.</returns>
        public virtual bool IsValidActivity(ITurnContext context)
        {
            return context.Activity.Type == ActivityTypes.Message
                && !string.IsNullOrEmpty(context.Activity.Text);
        }

        /// <summary>
        /// Handles the signin/verifyState activity. The onUserSignInSuccess and onUserSignInFailure handlers will be called based on the result.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns></returns>
        public async Task HandleSignInActivity(ITurnContext context, TState state, CancellationToken cancellationToken)
        {
            try
            {
                string userDialogStatePropertyName = GetUserDialogStatePropertyName(context);
                DialogTurnResult result = await ContinueDialog(context, state, userDialogStatePropertyName);

                if (result.Status == DialogTurnStatus.Complete)
                {
                    // OAuthPrompt dialog should have sent an invoke response already.
                    TokenResponse? tokenResponse = result.Result as TokenResponse;
                    if (tokenResponse != null)
                    {
                        // Successful sign in
                        AuthUtilities.SetTokenInState(state, _name, tokenResponse.Token);

                        if (TryGetUserAuthState(context, state, out Dictionary<string, string> userAuthState))
                        {
                            if (userAuthState.ContainsKey("message"))
                            {
                                context.Activity.Text = userAuthState["message"];
                            }
                            else
                            {
                                context.Activity.Text = "";
                            }
                        }
                        else
                        {
                            context.Activity.Text = "";
                        }

                        if (_userSignInSuccessHandler != null)
                        {
                            await _userSignInSuccessHandler(context, state);
                        }
                    }
                    else
                    {
                        // Failed sign in
                        if (_userSignInFailureHandler != null)
                        {
                            await _userSignInFailureHandler(context, state, new TeamsAIAuthException("Authentication flow completed without a token.", TeamsAIAuthExceptionReason.CompletionWithoutToken));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                string message = $"Unexpected error encountered while signing in: {ex.Message}.\nIncoming activity details: type: {context.Activity.Type}, name: {context.Activity.Name}";

                if (_userSignInFailureHandler != null)
                {
                    await _userSignInFailureHandler(context, state, new TeamsAIAuthException(message));
                }
            }
        }

        /// <summary>
        /// The handler function is called when the user has successfully signed in
        /// </summary>
        /// <param name="handler">The handler function to call when the user has successfully signed in</param>
        public void OnUserSignInSuccess(Func<ITurnContext, TState, Task> handler)
        {
            _userSignInSuccessHandler = handler;
        }

        /// <summary>
        /// The handler function is called when the user sign in flow fails
        /// </summary>
        /// <param name="handler">The handler function to call when the user failed to signed in</param>
        public void OnUserSignInFailure(Func<ITurnContext, TState, TeamsAIAuthException, Task> handler)
        {
            _userSignInFailureHandler = handler;
        }

        /// <summary>
        /// The route selector for signin/verifyState activity
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>True if the activity should be handled by current authentication hanlder. Otherwise, false.</returns>
        protected virtual Task<bool> VerifyStateRouteSelector(ITurnContext context, CancellationToken cancellationToken)
        {
            return Task.FromResult(context.Activity.Type == ActivityTypes.Invoke
                && context.Activity.Name == SignInConstants.VerifyStateOperationName);
        }

        /// <summary>
        /// The route selector for signin/tokenExchange activity
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>True if the activity should be handled by current authentication hanlder. Otherwise, false.</returns>
        protected virtual Task<bool> TokenExchangeRouteSelector(ITurnContext context, CancellationToken cancellationToken)
        {
            return Task.FromResult(context.Activity.Type == ActivityTypes.Invoke
                && context.Activity.Name == SignInConstants.TokenExchangeOperationName);
        }

        private string GetUserAuthStatePropertyName(ITurnContext context)
        {
            return $"__{context.Activity.From.Id}:{_name}:Bot:AuthState__";
        }

        private string GetUserDialogStatePropertyName(ITurnContext context)
        {
            return $"__{context.Activity.From.Id}:{_name}:DialogState__";
        }

        private bool TryGetUserAuthState(ITurnContext context, TState state, out Dictionary<string, string> authState)
        {
            string propertyName = GetUserAuthStatePropertyName(context);
            return state.Conversation.TryGetValue(propertyName, out authState);
        }

        private void DeleteAuthFlowState(ITurnContext context, TState state)
        {
            // Delete user auth state
            string userAuthStatePropertyName = GetUserAuthStatePropertyName(context);
            if (state.Conversation.ContainsKey(userAuthStatePropertyName))
            {
                state.Conversation.Remove(userAuthStatePropertyName);
            }

            // Delete user dialog state
            string userDialogStatePropertyName = GetUserDialogStatePropertyName(context);
            if (state.Conversation.ContainsKey(userDialogStatePropertyName))
            {
                state.Conversation.Remove(userDialogStatePropertyName);
            }
        }

        /// <summary>
        /// Run or continue the authentication dialog.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="dialogStateProperty">The property name for storing dialog state.</param>
        /// <returns>Dialog turn result that contains token if sign in success</returns>
        public abstract Task<DialogTurnResult> RunDialog(ITurnContext context, TState state, string dialogStateProperty);

        /// <summary>
        /// Continue the authentication dialog.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="dialogStateProperty">The property name for storing dialog state.</param>
        /// <returns>Dialog turn result that contains token if sign in success</returns>
        public abstract Task<DialogTurnResult> ContinueDialog(ITurnContext context, TState state, string dialogStateProperty);
    }
}
