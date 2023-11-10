using Microsoft.Bot.Schema;
using Microsoft.Teams.AI.AI.Models;

namespace Microsoft.Teams.AI.AI.Prompt
{
    /// <summary>
    /// Response returned by a `PromptCompletionClient`.
    /// </summary>
    public class PromptResponse
    {
        /// <summary>
        /// Status of the prompt response.
        /// </summary>
        public PromptResponseStatus Status { get; set; }

        /// <summary>
        /// Message returned.
        /// </summary>
        public ChatMessage? Message { get; set; }

        /// <summary>
        /// Error returned.
        /// </summary>
        public Error? Error { get; set; }
    }

    /// <summary>
    /// Status of the prompt response.
    /// </summary>
    public enum PromptResponseStatus
    {
        /// <summary>
        /// Success - The prompt was successfully completed.
        /// </summary>
        Success,
        /// <summary>
        /// Error - An error occurred while completing the prompt.
        /// </summary>
        Error,
        /// <summary>
        /// RateLimited - The request was rate limited.
        /// </summary>
        RateLimited,
        /// <summary>
        /// InvalidResponse - The response was invalid.
        /// </summary>
        InvalidResponse,
        /// <summary>
        /// TooLong - The rendered prompt exceeded the `max_input_tokens` limit.
        /// </summary>
        TooLong
    }
}
