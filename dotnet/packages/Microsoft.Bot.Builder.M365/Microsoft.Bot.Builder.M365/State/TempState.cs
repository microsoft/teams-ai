using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.State
{
    /// <summary>
    /// Temporary state.
    /// </summary>
    /// <remarks>
    /// Inherit a new class from this base abstract class to strongly type the applications temp state.
    /// </remarks>
    public class TempState : Dictionary<string, object>
    {
        public const string InputKey = "input";
        public const string OutputKey = "output";
        public const string HistoryKey = "history";

        public TempState() : base()
        {
            this[InputKey] = string.Empty;
            this[OutputKey] = string.Empty;
            this[HistoryKey] = string.Empty;
        }

        /// <summary>
        /// Input pass to an AI prompt
        /// </summary>
        public string Input
        {
            get => Get<string>(InputKey)!;
            set => Set(InputKey, value);
        }

        /// <summary>
        /// Formatted conversation history for embedding in an AI prompt
        /// </summary>
        public string Output
        {
            get => Get<string>(OutputKey)!;
            set => Set(OutputKey, value);
        }

        /// <summary>
        /// Output returned from an AI prompt or function
        /// </summary>
        public string History
        {
            get => Get<string>(InputKey)!;
            set => Set(HistoryKey, value);
        }

        public T? Get<T>(string key) where T : class
        {
            if (TryGetValue(key, out object value))
            {
                if (value is T t)
                {
                    return t;
                };
            }

            // Return null if either the key or type don't match
            return null;
        }

        public void Set<T>(string key, T value)
        {
            Verify.ParamNotNull(key, nameof(key));
            Verify.ParamNotNull(value, nameof(value));

            this[key] = value!;
        }
    }
}
