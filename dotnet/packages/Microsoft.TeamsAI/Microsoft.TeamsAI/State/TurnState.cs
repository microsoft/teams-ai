using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Base class defining a collection of turn state scopes.
    /// Developers can create a derived class that extends `TurnState` to add additional state scopes.
    /// </summary>
    /// <typeparam name="TConversationState">Optional. Type of the conversation state object being persisted.</typeparam>
    /// <typeparam name="TUserState">Optional. Type of the user state object being persisted.</typeparam>
    /// <typeparam name="TTempState">Optional. Type of the temp state object being persisted.</typeparam>
    public class TurnState<TConversationState, TUserState, TTempState> : Record, IMemory, ITurnState<TConversationState, TUserState, TTempState>
        where TConversationState : Record, new()
        where TUserState : Record, new()
        where TTempState : TempState, new()
    {
        private Dictionary<string, TurnStateEntry<Record>> _scopes = new();
        private bool _isLoaded = false;
        private Task<bool>? _loadingTask = Task.FromResult(false);

        /// <summary>
        /// Name of the conversation currScope.
        /// </summary>
        public const string CONVERSATION_SCOPE = "conversation";

        /// <summary>
        /// Name of the user currScope.
        /// </summary>
        public const string USER_SCOPE = "user";

        /// <summary>
        /// Name of the temp currScope.
        /// </summary>
        public const string TEMP_SCOPE = "temp";

        /// <summary>
        /// Provides the current status of the load.
        /// </summary>
        /// <returns>Returns true if the scopes have been loaded, false otherwise.</returns>
        public bool IsLoaded() { return _isLoaded; }

        /// <summary>
        /// Returns the TurnStateEntry associated with the specified currScope.
        /// </summary>
        /// <param name="scope">The specified currScope.</param>
        /// <returns>The state saved for the currScope.</returns>
        public TurnStateEntry<Record> GetScope(string scope)
        {
            return _scopes[scope];
        }

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public TConversationState? Conversation
        {
            get
            {
                TurnStateEntry<Record> scope = GetScope(CONVERSATION_SCOPE);
                Verify.ParamNotNull(scope);
                return scope.Value as TConversationState;
            }
            set
            {
                Verify.ParamNotNull(value);
                TurnStateEntry<Record> scope = GetScope(CONVERSATION_SCOPE);
                Verify.ParamNotNull(scope);
                scope.Replace(value);
            }
        }

        /// <summary>
        /// Stores all the user related state.
        /// </summary>
        public TUserState? User
        {
            get
            {
                TurnStateEntry<Record> scope = GetScope(USER_SCOPE);
                Verify.ParamNotNull(scope);
                return scope.Value as TUserState;
            }
            set
            {
                Verify.ParamNotNull(value);
                TurnStateEntry<Record> scope = GetScope(USER_SCOPE);
                Verify.ParamNotNull(scope);
                scope.Replace(value);
            }
        }

        /// <summary>
        /// Stores all the temporary state for the current turn.
        /// </summary>
        public TTempState? Temp
        {
            get
            {
                TurnStateEntry<Record> scope = GetScope(TEMP_SCOPE);
                Verify.ParamNotNull(scope);
                return scope.Value as TTempState;
            }
            set
            {
                Verify.ParamNotNull(value);
                TurnStateEntry<Record> scope = GetScope(TEMP_SCOPE);
                Verify.ParamNotNull(scope);
                scope.Replace(value);
            }
        }

        /// <summary>
        /// Deletes the conversation state.
        /// </summary>
        public void DeleteConversationState()
        {
            TurnStateEntry<Record> scope = GetScope(CONVERSATION_SCOPE);
            Verify.ParamNotNull(scope);
            scope.Delete();
        }

        /// <summary>
        /// Deletes the temporary state.
        /// </summary>
        public void DeleteTempState()
        {
            TurnStateEntry<Record> scope = GetScope(TEMP_SCOPE);
            Verify.ParamNotNull(scope);
            scope.Delete();
        }

        /// <summary>
        /// Deletes the user state
        /// </summary>
        public void DeleteUserState()
        {
            TurnStateEntry<Record> scope = GetScope(USER_SCOPE);
            Verify.ParamNotNull(scope);
            scope.Delete();
        }

        /// <summary>
        /// Deletes a value from the memory.
        /// </summary>
        /// <param name="path">Path to the value to delete in the form of `[currScope].property`.
        /// If currScope is omitted, the value is deleted from the temporary currScope.</param>
        public void DeleteValue(string path)
        {
            (TurnStateEntry<Record> scope, string name) = GetScopeAndName(path);
            if (scope.Value.ContainsKey(name))
            {
                scope.Value.Remove(name);
            }
        }

        /// <summary>
        /// Checks if a value exists in the memory.
        /// </summary>
        /// <param name="path"> Path to the value to check in the form of `[currScope].property`.
        /// If currScope is omitted, the value is checked in the temporary currScope.</param>
        /// <returns>True if the value exists, false otherwise.</returns>
        public bool HasValue(string path)
        {
            (TurnStateEntry<Record> scope, string name) = GetScopeAndName(path);
            return scope.Value.ContainsKey(name);
        }

        /// <summary>
        /// Retrieves a value from the memory.
        /// </summary>
        /// <param name="path">Path to the value to retrieve in the form of `[currScope].property`.
        /// If currScope is omitted, the value is retrieved from the temporary currScope.</param>
        /// <returns>The value or undefined if not found.</returns>
        public object GetValue(string path)
        {
            (TurnStateEntry<Record> scope, string name) = GetScopeAndName(path);
            return scope.Value[name];
        }

        /// <summary>
        /// Assigns a value to the memory.
        /// </summary>
        /// <param name="path">Path to the value to assign in the form of `[currScope].property`.
        /// If currScope is omitted, the value is assigned to the temporary currScope.</param>
        /// <param name="value">Value to assign.</param>
        public void SetValue(string path, object value)
        {
            (TurnStateEntry<Record> scope, string name) = GetScopeAndName(path);
            scope.Value[name] = value;
        }

        /// <summary>
        /// Loads all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Optional. Storage provider to load state scopes from.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        /// <returns>True if the states need to be loaded.</returns>
        public async Task<bool> LoadStateAsync(IStorage? storage, ITurnContext turnContext)
        {
            // Only load on first call
            if (this._isLoaded)
            {
                return false;
            }

            // Check for existing load operation
            if (!(await this._loadingTask))
            {
                this._loadingTask = Task.Run(async () =>
                {
                    try
                    {
                        // Prevent additional load attempts
                        this._isLoaded = true;

                        // Compute state keys
                        List<string> keys = [];
                        Dictionary<string, string> scopes = OnComputeStorageKeys(turnContext);
                        foreach (KeyValuePair<string, string> currScope in scopes)
                        {
                            if (scopes.ContainsKey(currScope.Key))
                            {
                                keys.Add(scopes[currScope.Key]);
                            }
                        }

                        // Read items from storage provider (if configured)
                        IDictionary<string, object> items;
                        if (storage != null)
                        {
                            items = await storage.ReadAsync(keys.ToArray());
                        }
                        else
                        {
                            items = new Dictionary<string, object>();
                        }

                        // Create scopes for items
                        foreach (KeyValuePair<string, string> currScope in scopes)
                        {
                            if (scopes.ContainsKey(currScope.Key))
                            {
                                string storageKey = scopes[currScope.Key];
                                object value = items[storageKey];
                                this._scopes[currScope.Key] = new TurnStateEntry<Record>(value as Record, storageKey);
                            }
                        }

                        // Add the temp currScope
                        this._scopes[TEMP_SCOPE] = new TurnStateEntry<Record>(new TempState());

                        // Clear loading task
                        this._isLoaded = true;
                        this._loadingTask = null;
                        return true;
                    }
                    catch (Exception ex)
                    {
                        this._loadingTask = null;
                        throw new TeamsAIException($"Something went wrong when loading state: {ex.Message}", ex);
                    }
                });
            }

            return this._loadingTask.Result;
        }

        /// <summary>
        /// Saves all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Optional. Storage provider to save state scopes to.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        public async Task SaveStateAsync(IStorage? storage, ITurnContext turnContext)
        {
            // Check for existing load operation
            if (!this._isLoaded && this._loadingTask.Result)
            {
                // Wait for load to finish
                await this._loadingTask;
            }

            // Ensure loaded
            if (!this._isLoaded)
            {
                throw new ArgumentNullException($"TurnState hasn't been loaded. Call loadState() first.");
            }

            // Find changes and deletions
            Record changes = new();
            List<string> deletions = new();

            foreach (KeyValuePair<string, TurnStateEntry<Record>> scope in this._scopes)
            {
                if (!this._scopes.ContainsKey(scope.Key))
                {
                    continue;
                }
                TurnStateEntry<Record> entry = this._scopes[scope.Key];
                if (entry.StorageKey != null)
                {
                    if (entry.IsDeleted)
                    {
                        // Add to deletion list
                        if (deletions != null)
                        {
                            deletions.Add(entry.StorageKey);
                        }
                        else
                        {
                            deletions = [entry.StorageKey];
                        }
                    }
                    else if (entry.HasChanged)
                    {
                        // Add to change set
                        if (changes == null)
                        {
                            changes = new();
                        }
                        changes[entry.StorageKey] = entry.Value;
                    }
                }
            }

            // Do we have a storage provider?
            if (storage != null)
            {
                // Apply changes
                List<Task> tasks = [];
                if (changes.Keys.Count > 0)
                {
                    tasks.Add(storage.WriteAsync(changes));
                }

                // Apply deletions
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

        /// <summary>
        /// Computes the state keys
        /// </summary>
        /// <param name="context">Context for the current turn.</param>
        /// <returns>Stored conversation and user scopes.</returns>
        protected Dictionary<string, string> OnComputeStorageKeys(ITurnContext context)
        {
            // Compute state keys
            Activity activity = context.Activity;
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

            Dictionary<string, string> keys = new();
            keys.Add(CONVERSATION_SCOPE, conversationKey);
            keys.Add(USER_SCOPE, userKey);
            return keys;
        }

        private (TurnStateEntry<Record>, string) GetScopeAndName(string path)
        {
            // Get variable currScope and name
            string[] parts = path.Split('.');
            if (parts.Length > 2)
            {
                throw new ArgumentException($"Invalid state path: ${path}");
            }
            else if (parts.Length == 1)
            {
                parts.Prepend(TEMP_SCOPE);
            }

            // Validate currScope
            TurnStateEntry<Record> scope = GetScope(parts[0]);
            if (scope == null)
            {
                throw new ArgumentNullException($"Invalid state currScope: ${parts[0]}");
            }

            return (scope, parts[1]);
        }
    }

    /// <summary>
    /// Defines the state scopes.
    /// </summary>
    public class TurnState : TurnState<Record, Record, TempState> { }
}
