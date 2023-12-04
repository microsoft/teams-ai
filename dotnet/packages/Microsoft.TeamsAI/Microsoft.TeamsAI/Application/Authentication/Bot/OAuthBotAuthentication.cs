using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Teams.AI.Application.Authentication.Bot;
using Microsoft.Teams.AI.State;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication for bot in Teams using OAuth Connection.
    /// </summary>
    internal class OAuthBotAuthentication<TState> : BotAuthenticationBase<TState>
        where TState : TurnState, new()
    {
        private OAuthPrompt _oauthPrompt;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="app">The application instance</param>
        /// <param name="oauthPromptSettings">The OAuth prompt settings</param>
        /// <param name="settingName">The name of current authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        public OAuthBotAuthentication(Application<TState> app, OAuthPromptSettings oauthPromptSettings, string settingName, IStorage? storage = null) : base(app, settingName, storage)
        {
            // Create OAuthPrompt
            this._oauthPrompt = new OAuthPrompt("OAuthPrompt", oauthPromptSettings);

            // Handles deduplication of token exchange event when using SSO with Bot Authentication
            app.Adapter.Use(new FilteredTeamsSSOTokenExchangeMiddleware(storage ?? new MemoryStorage(), settingName));
        }

        /// <summary>
        /// Continue the authentication dialog.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="dialogStateProperty">The property name for storing dialog state.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>Dialog turn result that contains token if sign in success</returns>
        public override async Task<DialogTurnResult> ContinueDialog(ITurnContext context, TState state, string dialogStateProperty, CancellationToken cancellationToken = default)
        {
            DialogContext dialogContext = await this.CreateDialogContextAsync(context, state, dialogStateProperty, cancellationToken);
            return await dialogContext.ContinueDialogAsync(cancellationToken);
        }

        /// <summary>
        /// Run or continue the authentication dialog.
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="state">The turn state</param>
        /// <param name="dialogStateProperty">The property name for storing dialog state.</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>Dialog turn result that contains token if sign in success</returns>
        public override async Task<DialogTurnResult> RunDialog(ITurnContext context, TState state, string dialogStateProperty, CancellationToken cancellationToken = default)
        {
            DialogContext dialogContext = await this.CreateDialogContextAsync(context, state, dialogStateProperty, cancellationToken);
            DialogTurnResult results = await dialogContext.ContinueDialogAsync(cancellationToken);
            if (results.Status == DialogTurnStatus.Empty)
            {
                results = await dialogContext.BeginDialogAsync(this._oauthPrompt.Id, null, cancellationToken);
            }
            return results;
        }

        private async Task<DialogContext> CreateDialogContextAsync(ITurnContext context, TState state, string dialogStateProperty, CancellationToken cancellationToken = default)
        {
            IStatePropertyAccessor<DialogState> accessor = new TurnStateProperty<DialogState>(state, "conversation", dialogStateProperty);
            DialogSet dialogSet = new(accessor);
            dialogSet.Add(_oauthPrompt);
            return await dialogSet.CreateContextAsync(context, cancellationToken);
        }
    }
}
