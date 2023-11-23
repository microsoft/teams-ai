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
    public class TurnState : IMemory
    {
        private Dictionary<string, TurnStateEntry> _scopes = new();
        private bool _isLoaded = false;
        private Task<bool>? _loadingTask = Task.FromResult(false);

        /// <summary>
        /// Name of the conversation scope.
        /// </summary>
        public const string CONVERSATION_SCOPE = "conversation";

        /// <summary>
        /// Name of the user scope.
        /// </summary>
        public const string USER_SCOPE = "user";

        /// <summary>
        /// Name of the temp scope.
        /// </summary>
        public const string TEMP_SCOPE = "temp";

        /// <summary>
        /// Initializes a new instance of the <see cref="TurnState"/> class.
        /// </summary>
        public TurnState()
        {
            ScopeDefaults = new Dictionary<string, Record>();
            ScopeDefaults.Add(CONVERSATION_SCOPE, new Record());
            ScopeDefaults.Add(USER_SCOPE, new Record());
        }

        /// <summary>
        /// The default values to initial for each scope.
        /// </summary>
        protected Dictionary<string, Record> ScopeDefaults;

        /// <summary>
        /// Provides the current status of the load.
        /// </summary>
        /// <returns>Returns true if the scopes have been loaded, false otherwise.</returns>
        public bool IsLoaded() { return _isLoaded; }

        /// <summary>
        /// Returns the TurnStateEntry associated with the specified scope.
        /// </summary>
        /// <param name="name">The specified scope.</param>
        /// <returns>The state saved for the scope.</returns>
        public TurnStateEntry? GetScope(string name)
        {
            try
            {
                return _scopes[name];
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Stores all the conversation-related state.
        /// </summary>
        public Record Conversation
        {
            get
            {
                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return scope.Value!;
            }
            set
            {
                Verify.ParamNotNull(value);

                TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }

        /// <summary>
        /// Stores all the user related state.
        /// </summary>
        public Record User
        {
            get
            {
                TurnStateEntry? scope = GetScope(USER_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return scope.Value!;
            }
            set
            {
                Verify.ParamNotNull(value);

                TurnStateEntry? scope = GetScope(USER_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }

        /// <summary>
        /// Stores all the temporary state for the current turn.
        /// </summary>
        public TempState Temp
        {
            get
            {
                TurnStateEntry? scope = GetScope(TEMP_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                return (TempState)scope.Value!;
            }
            set
            {
                Verify.ParamNotNull(value);

                TurnStateEntry? scope = GetScope(TEMP_SCOPE);
                if (scope == null)
                {
                    throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
                }

                scope.Replace(value!);
            }
        }

        /// <summary>
        /// Deletes the conversation state.
        /// </summary>
        public void DeleteConversationState()
        {
            TurnStateEntry? scope = GetScope(CONVERSATION_SCOPE);
            if (scope == null)
            {
                throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
            }

            scope.Delete();
        }

        /// <summary>
        /// Deletes the temporary state.
        /// </summary>
        public void DeleteTempState()
        {
            TurnStateEntry? scope = GetScope(TEMP_SCOPE);
            if (scope == null)
            {
                throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
            }
            scope.Delete();
        }

        /// <summary>
        /// Deletes the user state
        /// </summary>
        public void DeleteUserState()
        {
            TurnStateEntry? scope = GetScope(USER_SCOPE);
            if (scope == null)
            {
                throw new ArgumentException("TurnState hasn't been loaded. Call LoadStateAsync() first.");
            }
            scope.Delete();
        }

        /// <summary>
        /// Deletes a value from the memory.
        /// </summary>
        /// <param name="path">Path to the value to delete in the form of `[scope].property`.
        /// If scope is omitted, the value is deleted from the temporary scope.</param>
        public void DeleteValue(string path)
        {
            (TurnStateEntry scope, string name) = GetScopeAndName(path);
            if (scope.Value!.ContainsKey(name))
            {
                scope.Value.Remove(name);
            }
        }

        /// <summary>
        /// Checks if a value exists in the memory.
        /// </summary>
        /// <param name="path"> Path to the value to check in the form of `[scope].property`.
        /// If scope is omitted, the value is checked in the temporary scope.</param>
        /// <returns>True if the value exists, false otherwise.</returns>
        public bool HasValue(string path)
        {
            (TurnStateEntry scope, string name) = GetScopeAndName(path);
            return scope.Value?.ContainsKey(name) == true;
        }

        /// <summary>
        /// Retrieves a value from the memory.
        /// </summary>
        /// <param name="path">Path to the value to retrieve in the form of `[scope].property`.
        /// If scope is omitted, the value is retrieved from the temporary scope.</param>
        /// <returns>The value or undefined if not found.</returns>
        public object? GetValue(string path)
        {
            (TurnStateEntry scope, string name) = GetScopeAndName(path);

            if (scope.Value?.ContainsKey(name) != true)
            {
                return null;
            }

            return scope.Value[name];
        }

        /// <summary>
        /// Assigns a value to the memory.
        /// </summary>
        /// <param name="path">Path to the value to assign in the form of `[scope].property`.
        /// If scope is omitted, the value is assigned to the temporary scope.</param>
        /// <param name="value">Value to assign.</param>
        public void SetValue(string path, object value)
        {
            (TurnStateEntry scope, string name) = GetScopeAndName(path);
            scope.Value![name] = value;
        }

        /// <summary>
        /// Loads all of the state scopes for the current turn.
        /// </summary>
        /// <param name="storage">Optional. Storage provider to load state scopes from.</param>
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        /// <param name="cancellationToken">Optional. The cancellation token.</param>   
        /// <returns>True if the states need to be loaded.</returns>
        public async Task<bool> LoadStateAsync(IStorage? storage, ITurnContext turnContext, CancellationToken cancellationToken = default)
        {
            // Only load on first call
            if (this._isLoaded)
            {
                return false;
            }

            // Check for existing load operation
            if (!(await this._loadingTask!))
            {
                this._loadingTask = Task.Run(async () =>
                {
                    try
                    {
                        // Prevent additional load attempts
                        this._isLoaded = true;

                        // Compute state keys
                        List<string> keys = new();
                        Dictionary<string, string> scopes = OnComputeStorageKeys(turnContext);
                        foreach (KeyValuePair<string, string> scope in scopes)
                        {
                            if (scopes.ContainsKey(scope.Key))
                            {
                                keys.Add(scopes[scope.Key]);
                            }
                        }

                        // Read items from storage provider (if configured)
                        IDictionary<string, object> items;
                        if (storage != null)
                        {
                            items = await storage.ReadAsync(keys.ToArray(), cancellationToken);
                        }
                        else
                        {
                            items = new Dictionary<string, object>();
                        }

                        // Create scopes for items
                        foreach (KeyValuePair<string, string> scope in scopes)
                        {
                            if (scopes.ContainsKey(scope.Key))
                            {
                                Record scopeDefault = ScopeDefaults.ContainsKey(scope.Key) ? ScopeDefaults[scope.Key] : new Record();
                                string storageKey = scopes[scope.Key];
                                object value = items.ContainsKey(storageKey) ? items[storageKey] : scopeDefault;
                                this._scopes[scope.Key] = new TurnStateEntry((value as Record)!, storageKey);
                            }
                        }

                        // Add the temp scope
                        this._scopes[TEMP_SCOPE] = new TurnStateEntry(new TempState());

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
        /// <param name="turnContext">Context for the current turn of conversation with the user.</param>
        /// <param name="storage">Optional. Storage provider to save state scopes to.</param>
        public async Task SaveStateAsync(ITurnContext turnContext, IStorage? storage)
        {
            Verify.ParamNotNull(turnContext);

            // Check for existing load operation
            if (!this._isLoaded && this._loadingTask!.Result)
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

            foreach (KeyValuePair<string, TurnStateEntry> scope in this._scopes)
            {
                if (!this._scopes.ContainsKey(scope.Key))
                {
                    continue;
                }
                TurnStateEntry entry = this._scopes[scope.Key];
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
                            deletions = new() { entry.StorageKey };
                        }
                    }
                    else if (entry.HasChanged)
                    {
                        // Add to change set
                        if (changes == null)
                        {
                            changes = new();
                        }
                        changes[entry.StorageKey] = entry.Value!;
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
        protected virtual Dictionary<string, string> OnComputeStorageKeys(ITurnContext context)
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

        private (TurnStateEntry, string) GetScopeAndName(string path)
        {
            // Get variable scope and name
            string[] parts = path.Split('.');
            if (parts.Length > 2)
            {
                throw new ArgumentException($"Invalid state path: ${path}");
            }
            else if (parts.Length == 1)
            {
                parts.Prepend(TEMP_SCOPE);
            }

            // Validate scope
            TurnStateEntry? scope = GetScope(parts[0]);
            if (scope == null)
            {
                throw new ArgumentNullException($"Invalid state scope: ${parts[0]}");
            }

            return (scope, parts[1]);
        }
    }
}
