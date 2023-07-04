using Microsoft.Bot.Builder.M365.Utilities;
using Microsoft.Bot.Schema;

namespace Microsoft.Bot.Builder.M365.State
{
    /// <summary>
    /// Defines the default state scopes persisted by the `DefaultTurnStateManager`.
    /// </summary>
    /// <typeparam name="TConversationState">Optional. Type of the conversation state object being persisted.</typeparam>
    /// <typeparam name="TUserState">Optional. Type of the user state object being persisted.</typeparam>
    /// <typeparam name="TTempState">Optional. Type of the temp state object being persisted.</typeparam>
    public class DefaultTurnStateManager<TDefaultTurnState, TConversationState, TUserState, TTempState> : ITurnStateManager<TDefaultTurnState>
        where TDefaultTurnState : DefaultTurnState<TConversationState, TUserState, TTempState>, new()
        where TConversationState : Dictionary<string, object>, new()
        where TUserState : Dictionary<string, object>, new()
        where TTempState : TempState, new()
    {

        public DefaultTurnStateManager() { }

        public async Task<TDefaultTurnState> LoadStateAsync(IStorage? storage, ITurnContext turnContext)
        {
            try
            {
                // Compute state keys
                Activity activity = turnContext.Activity;
                string channelId = activity.ChannelId;
                string botId = activity.Recipient.Id;
                string conversationId = activity.Conversation.Id;
                string userId = activity.From.Id;

                // TODO: update to a more appropriate guard method
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

                TDefaultTurnState state = new();
                TUserState? userState = null;
                TConversationState? conversationState = null;
                TTempState? tempState = null;

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
                tempState ??= new TTempState();

                state.UserState = new TurnStateEntry<TUserState>(userState, userKey);
                state.ConversationState = new TurnStateEntry<TConversationState>(conversationState, conversationKey);
                state.TempState = new TurnStateEntry<TTempState>(tempState);

                return state;

            }
            catch (Exception ex)
            {
                throw new TurnStateManagerException($"Something went wrong when loading state: {ex.Message}", ex);
            }
        }

        public async Task SaveStateAsync(IStorage? storage, ITurnContext turnContext, TDefaultTurnState turnState)
        {
            try
            {
                Verify.ParamNotNull(storage, nameof(storage));
                Verify.ParamNotNull(turnContext, nameof(turnContext));
                Verify.ParamNotNull(turnState, nameof(turnState));

                Dictionary<string, object> changes = new();
                List<string> deletions = new();

                foreach (string key in turnState.Keys)
                {
                    if (turnState.TryGetValue(key, out TurnStateEntry<object> entry))
                    {
                        if (entry.StorageKey != null)
                        {
                            if (entry.IsDeleted)
                            {
                                deletions.Add(key);
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
                throw new TurnStateManagerException($"Something went wrong when saving state: {ex.Message}", ex);
            }
        }
    }

    public class DefaultTurnStateManager : DefaultTurnStateManager<DefaultTurnState, Dictionary<string, object>, Dictionary<string, object>, TempState>
    {
    }
}
