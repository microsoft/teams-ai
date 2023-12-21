using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.State;
using Microsoft.Teams.AI.Exceptions;
using Newtonsoft.Json.Linq;
using System.Text.RegularExpressions;
using System.ComponentModel.Design;

namespace Microsoft.Teams.AI
{
    /// <summary>
    /// Handles authentication for bot in Teams using Teams SSO.
    /// </summary>
    internal class TeamsSsoBotAuthentication<TState> : BotAuthenticationBase<TState>
        where TState : TurnState, new()
    {
        private const string SSO_DIALOG_ID = "_TeamsSsoDialog";
        private Regex _tokenExchangeIdRegex;
        protected TeamsSsoPrompt _prompt;

        /// <summary>
        /// Initializes the class
        /// </summary>
        /// <param name="app">The application instance</param>
        /// <param name="name">The name of current authentication handler</param>
        /// <param name="settings">The authentication settings</param>
        /// <param name="storage">The storage to save turn state</param>
        public TeamsSsoBotAuthentication(Application<TState> app, string name, TeamsSsoSettings settings, IStorage? storage = null) : base(app, name, storage)
        {
            _tokenExchangeIdRegex = new Regex("[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-" + name);
            _prompt = new TeamsSsoPrompt("TeamsSsoPrompt", name, settings);

            // Do not save state for duplicate token exchange events to avoid eTag conflicts
            app.OnAfterTurn((context, state, cancellationToken) =>
            {
                return Task.FromResult(state.Temp.DuplicateTokenExchange != true);
            });
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
            IDialogContext dialogContext = await CreateSsoDialogContext(context, state, dialogStateProperty);
            return await dialogContext.ContinueDialogAsync();
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
            IDialogContext dialogContext = await CreateSsoDialogContext(context, state, dialogStateProperty);
            DialogTurnResult result = await dialogContext.ContinueDialogAsync();
            if (result.Status == DialogTurnStatus.Empty)
            {
                result = await dialogContext.BeginDialogAsync(SSO_DIALOG_ID);
            }
            return result;
        }

        /// <summary>
        /// The route selector for signin/tokenExchange activity
        /// </summary>
        /// <param name="context">The turn context</param>
        /// <param name="cancellationToken">The cancellation token</param>
        /// <returns>True if the activity should be handled by current authentication hanlder. Otherwise, false.</returns>
        protected override async Task<bool> TokenExchangeRouteSelector(ITurnContext context, CancellationToken cancellationToken)
        {
            JObject? value = context.Activity.Value as JObject;
            JToken? id = value?["id"];
            string idStr = id?.ToString() ?? "";
            return await base.TokenExchangeRouteSelector(context, cancellationToken)
                && this._tokenExchangeIdRegex.IsMatch(idStr);
        }

        protected virtual IDialogSet CreateDialogSet(IStatePropertyAccessor<DialogState> dialogState)
        {
            return new DialogSetAdapter(dialogState);
        }

        private async Task<IDialogContext> CreateSsoDialogContext(ITurnContext context, TState state, string dialogStateProperty)
        {
            TurnStateProperty<DialogState> accessor = new(state, "conversation", dialogStateProperty);
            IDialogSet dialogSet = CreateDialogSet(accessor);
            WaterfallDialog ssoDialog = new(SSO_DIALOG_ID);

            dialogSet.Add(this._prompt);
            dialogSet.Add(new WaterfallDialog(SSO_DIALOG_ID, new WaterfallStep[]
            {
                async (step, cancellationToken) =>
                {
                    return await step.BeginDialogAsync(this._prompt.Id);
                },
                async (step, cancellationToken) =>
                {
                    TokenResponse? tokenResponse = step.Result as TokenResponse;
                    if (tokenResponse != null && await ShouldDedup(context))
                    {
                        state.Temp.DuplicateTokenExchange = true;
                        return Dialog.EndOfTurn;
                    }
                    return await step.EndDialogAsync(step.Result);
                }
            }));
            return await dialogSet.CreateContextAsync(context);
        }



        private async Task<bool> ShouldDedup(ITurnContext context)
        {
            string key = GetStorageKey(context);
            string id = (context.Activity.Value as JObject)?.Value<string>("id")!; // The id exists if GetStorageKey success
            IStoreItem storeItem = new TokenStoreItem(id);
            Dictionary<string, object> storesItems = new()
            {
                {key, storeItem}
            };

            try
            {
                await this._storage.WriteAsync(storesItems);
            }
            catch (Exception ex)
            {
                if (ex.Message.StartsWith("Etag conflict", StringComparison.OrdinalIgnoreCase) || ex.Message.Contains("pre-condition is not met"))
                {
                    return true;
                }
                throw;
            }
            return false;
        }

        private string GetStorageKey(ITurnContext context)
        {
            if (context == null || context.Activity == null
                || context.Activity.Conversation == null)
            {
                throw new AuthException("Invalid context, can not get storage key!");
            }

            Activity activity = context.Activity;
            string channelId = activity.ChannelId;
            string conversationId = activity.Conversation.Id;
            if (activity.Type != ActivityTypes.Invoke || activity.Name != SignInConstants.TokenExchangeOperationName)
            {
                throw new AuthException("TokenExchangeState can only be used with Invokes of signin/tokenExchange.");
            }
            JObject value = JObject.FromObject(activity.Value);
            JToken? id = value["id"];
            if (id == null)
            {
                throw new AuthException("Invalid signin/tokenExchange. Missing activity.value.id.");
            }
            return $"{channelId}/{conversationId}/{id}";
        }
    }

    internal class TokenStoreItem : IStoreItem
    {
        public string ETag { get; set; }

        public TokenStoreItem(string etag)
        {
            ETag = etag;
        }
    }

    internal interface IDialogSet
    {
        public DialogSetAdapter Add(Dialog dialog);

        public Task<IDialogContext> CreateContextAsync(ITurnContext turnContext, CancellationToken cancellationToken = default);
    }

    internal class DialogSetAdapter : IDialogSet
    {
        private DialogSet _dialogSet;

        public DialogSetAdapter(IStatePropertyAccessor<DialogState> dialogState)
        {
            _dialogSet = new DialogSet(dialogState);
        }
        
        public DialogSetAdapter Add(Dialog dialog)
        {
            _dialogSet.Add(dialog);
            return this;
        }

        public async Task<IDialogContext> CreateContextAsync(ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            return new DialogContextAdapter(await _dialogSet.CreateContextAsync(turnContext, cancellationToken));
        }
    }

    internal interface IDialogContext
    {
        public Task<DialogTurnResult> BeginDialogAsync(string dialogId, object? options = null, CancellationToken cancellationToken = default);

        public Task<DialogTurnResult> ContinueDialogAsync(CancellationToken cancellationToken = default);
    }

    internal class DialogContextAdapter : IDialogContext
    {
        private DialogContext _dialogContext;

        public DialogContextAdapter(DialogContext dialogContext)
        {
            _dialogContext = dialogContext;
        }

        public async Task<DialogTurnResult> BeginDialogAsync(string dialogId, object? options = null, CancellationToken cancellationToken = default)
        {
            return await _dialogContext.BeginDialogAsync(dialogId, options, cancellationToken);
        }

        public async Task<DialogTurnResult> ContinueDialogAsync(CancellationToken cancellationToken = default)
        {
            return await _dialogContext.ContinueDialogAsync(cancellationToken);
        }
    }
}
