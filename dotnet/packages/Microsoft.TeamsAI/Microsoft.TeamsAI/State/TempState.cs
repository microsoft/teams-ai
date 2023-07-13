using Microsoft.TeamsAI.Utilities;

namespace Microsoft.TeamsAI.State
{
    /// <summary>
    /// Temporary state.
    /// </summary>
    /// <remarks>
    /// Inherit a new class from this base abstract class to strongly type the applications temp state.
    /// </remarks>
    public class TempState : StateBase
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
            get => Get<string>(HistoryKey)!;
            set => Set(HistoryKey, value);
        }
    }
}
