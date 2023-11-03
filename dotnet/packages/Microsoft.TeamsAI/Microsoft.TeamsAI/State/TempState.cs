
namespace Microsoft.Teams.AI.State
{
    /// <summary>
    /// Temporary state.
    /// </summary>
    /// <remarks>
    /// Inherit a new class from this base abstract class to strongly type the applications temp state.
    /// </remarks>
    public class TempState : StateBase
    {
        /// <summary>
        /// Name of the input property.
        /// </summary>
        public const string InputKey = "input";

        /// <summary>
        /// Name of the output property.
        /// </summary>
        public const string OutputKey = "output";

        /// <summary>
        /// Name of the history property.
        /// </summary>
        public const string HistoryKey = "history";

        /// <summary>
        /// Creates a new instance of the <see cref="TempState"/> class.
        /// </summary>
        public TempState() : base()
        {
            this[InputKey] = string.Empty;
            this[OutputKey] = string.Empty;
            this[HistoryKey] = string.Empty;
        }

        /// <summary>
        /// Input passed to an AI prompt
        /// </summary>
        public string Input
        {
            get => Get<string>(InputKey)!;
            set => Set(InputKey, value);
        }

        // TODO: This is currently not used, should store AI prompt/function output here
        /// <summary>
        /// Output returned from an AI prompt or function
        /// </summary>
        public string Output
        {
            get => Get<string>(OutputKey)!;
            set => Set(OutputKey, value);
        }


        /// <summary>
        /// Formatted conversation history for embedding in an AI prompt
        /// </summary>
        public string History
        {
            get => Get<string>(HistoryKey)!;
            set => Set(HistoryKey, value);
        }
    }
}
