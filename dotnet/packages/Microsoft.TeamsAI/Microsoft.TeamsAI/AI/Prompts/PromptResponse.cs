using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.AI.Prompts
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
        /// User input message sent to the model. null if no input was sent.
        /// </summary>
        public ChatMessage? Input { get; set; }

        /// <summary>
        /// Message returned.
        /// </summary>
        public ChatMessage? Message { get; set; }

        /// <summary>
        /// Error returned.
        /// </summary>
        public TeamsAIException? Error { get; set; }
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
