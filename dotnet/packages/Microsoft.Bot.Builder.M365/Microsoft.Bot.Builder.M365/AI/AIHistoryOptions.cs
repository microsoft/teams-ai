
namespace Microsoft.Bot.Builder.M365.AI
{
    public class AIHistoryOptions
    {
        /// <summary>
        /// Whether the AI system should track conversation history.
        /// </summary>
        /// <remarks>
        /// Defaults to true
        /// </remarks>
        public bool TrackHistory { get; set; } = true;

        /// <summary>
        /// The maximum number of turns to remember.
        /// </summary>
        /// <remarks>
        /// Defaults to 3.
        /// </remarks>
        public int MaxTurns { get; set; } = 3;

        /// <summary>
        /// The maximum number of tokens worth of history to add to the prompt.
        /// </summary>
        /// <remarks>
        /// Defaults to 1000.
        /// </remarks>
        public int MaxTokens { get; set; } = 1000;

        /// <summary>
        /// The line separator to use when concatenating history.
        /// </summary>
        /// <remarks>
        /// Defaults to '\n'.
        /// </remarks>
        public string LineSeparator { get; set; } = "\n";

        /// <summary>
        /// The prefix to use for user history.
        /// </summary>
        /// <remarks>
        /// Defaults to 'User:'.
        /// </remarks>
        public string UserPrefix { get; set; } = "User:";

        /// <summary>
        /// The prefix to use for assistant history.
        /// </summary>
        /// <remarks>
        /// Defaults to 'Assistant:'.
        /// </remarks>
        public string AssistantPrefix { get; set; } = "Assistant:";

        /// <summary>
        /// Whether the conversation history should include the plan object returned by the model or
        /// just the text of any SAY commands.
        /// </summary>
        /// <remarks>
        /// Defaults to 'planObject'.
        /// </remarks>
        public AssistantHistoryType AssistantHistoryType { get; set; } = AssistantHistoryType.PlanObject;
    }

    public enum AssistantHistoryType
    {
        Text,
        PlanObject
    }
}
