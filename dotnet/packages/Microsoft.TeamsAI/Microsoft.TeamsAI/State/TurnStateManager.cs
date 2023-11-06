using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Builder;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Handles loading and saving of the configured turn state class.
    /// </summary>
    /// <typeparam name="TState">Optional. Type of turn state that encompasses the conversation, user and temp state.</typeparam>
    /// <typeparam name="TConversationState">Optional. Type of the conversation state object being persisted.</typeparam>
    /// <typeparam name="TUserState">Optional. Type of the user state object being persisted.</typeparam>
    /// <typeparam name="TTempState">Optional. Type of the temp state object being persisted.</typeparam>
    public class TurnStateManager<TState, TConversationState, TUserState, TTempState> : ITurnStateManager<TState>
        where TState : TurnState<TConversationState, TUserState, TTempState>, new()
        where TConversationState : StateBase, new()
        where TUserState : StateBase, new()
        where TTempState : TempState, new()
    {
        /// <summary>
        /// Initializes a new instance of the <see cref="TurnStateManager{TState, TConversationState, TUserState, TTempState}"/> class.
        /// </summary>
        public TurnStateManager() { }

        /// <inheritdoc />
        public async Task<TState> LoadStateAsync(IStorage? storage, ITurnContext turnContext)
        {
            try
            {
                // Compute state keys
                Activity activity = turnContext.Activity;
                string channelId = activity.ChannelId;
                string botId = activity.Recipient.Id;
                string conversationId = activity.Conversation.Id;
                string userId = activity.From.Id;

                Verify.ParamNotNull(activity, "TurnContext.Activity");
                Verify.ParamNotNull(channelId, "TurnContext.Activity.ChannelId");
                Verify.ParamNotNull(botId, "TurnContext.Activity.Recipient.Id");
                Verify.ParamNotNull(conversationId, "TurnContext.Activity.Conversation.Id");
                Verify.ParamNotNull(userId, "TurnContext.Activity.From.Id");

                string conversationKey = $"{channelId}/${botId}/conversations/${conversationId}";
                string userKey = $"{channelId}/${botId}/users/${userId}";

                // read items from storage provider (if configured)
                IDictionary<string, object> items;
                if (storage != null)
                {
                    items = await storage.ReadAsync(new string[] { conversationKey, userKey });
                }
                else
                {
                    items = new Dictionary<string, object>();
                }

                TState state = new();
                TUserState? userState = null;
                TConversationState? conversationState = null;

                if (items.TryGetValue(userKey, out object userStateValue))
                {
                    userState = userStateValue as TUserState;
                }

                if (items.TryGetValue(conversationKey, out object conversationStateValue))
                {
                    conversationState = conversationStateValue as TConversationState;
                }

                userState ??= new TUserState();
                conversationState ??= new TConversationState();

                state.UserStateEntry = new TurnStateEntry<TUserState>(userState, userKey);
                state.ConversationStateEntry = new TurnStateEntry<TConversationState>(conversationState, conversationKey);
                state.TempStateEntry = new TurnStateEntry<TTempState>(new());

                return state;

            }
            catch (Exception ex)
            {
                throw new TeamsAIException($"Something went wrong when loading state: {ex.Message}", ex);
            }
        }

        /// <inheritdoc />
        public async Task SaveStateAsync(IStorage? storage, ITurnContext turnContext, TState turnState)
        {
            try
            {
                Verify.ParamNotNull(turnContext);
                Verify.ParamNotNull(turnState);

                Dictionary<string, object> changes = new();
                List<string> deletions = new();

                foreach (string key in turnState.Keys)
                {
                    if (turnState.TryGetValue(key, out IReadOnlyEntry<object> entry))
                    {
                        if (entry.StorageKey != null)
                        {
                            if (entry.IsDeleted)
                            {
                                deletions.Add(entry.StorageKey);
                            }

                            if (entry.HasChanged)
                            {
                                changes[entry.StorageKey] = entry.Value;
                            }
                        }
                    }

                }

                // Do we have a storage provider?
                if (storage != null)
                {
                    // Apply changes
                    List<Task> tasks = new();
                    if (changes.Keys.Count > 0)
                    {
                        tasks.Add(storage.WriteAsync(changes));
                    }

                    if (deletions.Count > 0)
                    {
                        tasks.Add(storage.DeleteAsync(deletions.ToArray()));
                    }

                    if (tasks.Count > 0)
                    {
                        await Task.WhenAll(tasks.ToArray());
                    }
                }
            }
            catch (Exception ex)
            {
                throw new TeamsAIException($"Something went wrong when saving state: {ex.Message}", ex);
            }
        }
    }

    /// <summary>
    /// Default turn state manager.
    /// </summary>
    public class TurnStateManager : TurnStateManager<TurnState, StateBase, StateBase, TempState>
    {
    }
}
