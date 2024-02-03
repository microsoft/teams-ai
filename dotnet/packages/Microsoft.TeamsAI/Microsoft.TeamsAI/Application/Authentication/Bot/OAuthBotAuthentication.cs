using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
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
        private readonly OAuthPrompt _oauthPrompt;
        private readonly OAuthSettings _oauthSettings;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="app">The application instance</param>
        /// <param name="oauthSettings">The OAuth prompt settings</param>
        /// <param name="settingName">The name of current authentication handler</param>
        /// <param name="storage">The storage to save turn state</param>
        public OAuthBotAuthentication(Application<TState> app, OAuthSettings oauthSettings, string settingName, IStorage? storage = null) : base(app, settingName, storage)
        {
            this._oauthSettings = oauthSettings;

            // Create OAuthPrompt
            this._oauthPrompt = new OAuthPrompt("OAuthPrompt", this._oauthSettings);

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
                Attachment card = await this.CreateOAuthCard(context, cancellationToken);
                Activity messageActivity = (Activity)MessageFactory.Attachment(card);
                PromptOptions options = new()
                {
                    Prompt = messageActivity,
                };

                results = await dialogContext.BeginDialogAsync(this._oauthPrompt.Id, options, cancellationToken);
            }
            return results;
        }

        private async Task<DialogContext> CreateDialogContextAsync(ITurnContext context, TState state, string dialogStateProperty, CancellationToken cancellationToken = default)
        {
            IStatePropertyAccessor<DialogState> accessor = new TurnStateProperty<DialogState>(state, "conversation", dialogStateProperty);
            DialogSet dialogSet = new(accessor);
            dialogSet.Add(this._oauthPrompt);
            return await dialogSet.CreateContextAsync(context, cancellationToken);
        }

        private async Task<Attachment> CreateOAuthCard(ITurnContext context, CancellationToken cancellationToken = default)
        {
            SignInResource signInResource = await UserTokenClientWrapper.GetSignInResourceAsync(context, this._oauthSettings.ConnectionName, cancellationToken);
            string? link = signInResource.SignInLink;
            TokenExchangeResource? tokenExchangeResource = null;

            if (this._oauthSettings.EnableSso == true)
            {
                tokenExchangeResource = signInResource.TokenExchangeResource;
            }

            return new Attachment
            {
                ContentType = OAuthCard.ContentType,
                Content = new OAuthCard
                {
                    Text = this._oauthSettings.Text,
                    ConnectionName = this._oauthSettings.ConnectionName,
                    Buttons = new[]
                    {
                        new CardAction
                        {
                                Title = this._oauthSettings.Title,
                                Text = this._oauthSettings.Text,
                                Type = "signin",
                                Value = link
                        },
                        },
                    TokenExchangeResource = tokenExchangeResource,
                    TokenPostResource = signInResource.TokenPostResource
                },
            };
        }
    }
}
