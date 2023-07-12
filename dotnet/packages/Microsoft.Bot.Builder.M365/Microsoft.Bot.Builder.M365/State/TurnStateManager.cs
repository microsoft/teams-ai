﻿using Microsoft.Bot.Builder.M365.Exceptions;
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
    public class TurnStateManager<TState, TConversationState, TUserState, TTempState> : ITurnStateManager<TState>
        where TState : TurnState<TConversationState, TUserState, TTempState>, new()
        where TConversationState : StateBase, new()
        where TUserState : StateBase, new()
        where TTempState : TempState, new()
    {

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
                throw new TurnStateManagerException($"Something went wrong when loading state: {ex.Message}", ex);
            }
        }

        /// <inheritdoc />
        public async Task SaveStateAsync(IStorage? storage, ITurnContext turnContext, TState turnState)
        {
            try
            {
                Verify.ParamNotNull(turnContext, nameof(turnContext));
                Verify.ParamNotNull(turnState, nameof(turnState));

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

    public class TurnStateManager : TurnStateManager<TurnState, StateBase, StateBase, TempState>
    {
    }
}
