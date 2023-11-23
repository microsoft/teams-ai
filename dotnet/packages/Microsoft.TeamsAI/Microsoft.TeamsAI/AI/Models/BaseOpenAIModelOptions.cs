using Microsoft.Teams.AI.AI.Prompts;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Base model options common to both OpenAI and Azure OpenAI services.
    /// </summary>
    public abstract class BaseOpenAIModelOptions
    {
        /// <summary>
        /// Optional. Type of completion to use for the default model.
        /// </summary>
        /// <remarks>
        /// The default value is `CompletionType.Chat`.
        /// </remarks>
        public CompletionConfiguration.CompletionType? CompletionType { get; set; }

        /// <summary>
        /// Optional. Whether to log requests to the console.
        /// </summary>
        /// <remarks>
        /// This is useful for debugging prompts.
        /// The default value is `false`.
        /// </remarks>
        public bool? LogRequests { get; set; }

        /// <summary>
        /// Optional. Retry policy to use when calling the OpenAI API.
        /// </summary>
        /// <remarks>
        /// The default retry policy is `{ TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) }`
        /// which means that the first retry will be after 2 seconds and the second retry will be after 5 seconds.
        /// </remarks>
        public List<TimeSpan>? RetryPolicy { get; set; }

        /// <summary>
        /// Optional. Whether to use `system` messages when calling the OpenAI API.
        /// </summary>
        /// <remarks>
        /// The current generation of models tend to follow instructions from `user` messages better
        /// then `system` messages so the default is `false`, which causes any `system` message in the
        /// prompt to be sent as `user` messages instead.
        /// </remarks>
        public bool? UseSystemMessages { get; set; }
    }
}
