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
        private string _inputKey = "input";
        private string _outputKey = "output";
        private string _historyKey = "history";

        /// <summary>
        /// Input pass to an AI prompt
        /// </summary>
        public string Input
        {
            get => Get<string>(_inputKey);
            set => Set(_inputKey, value);
        }

        /// <summary>
        /// Formatted conversation history for embedding in an AI prompt
        /// </summary>
        public string Output
        {
            get => Get<string>(_inputKey);
            set => Set(_outputKey, value);
        }

        /// <summary>
        /// Output returned from an AI prompt or function
        /// </summary>
        public string History
        {
            get => Get<string>(_inputKey);
            set => Set(_historyKey, value);
        }

        public T Get<T>(string key)
        {
            return (T)this[key];
        }

        public void Set<T>(string key, T value)
        {
            Verify.ParamNotNull(key, nameof(key));
            Verify.ParamNotNull(value, nameof(value));

            this[key] = value!;
        }
    }
}
