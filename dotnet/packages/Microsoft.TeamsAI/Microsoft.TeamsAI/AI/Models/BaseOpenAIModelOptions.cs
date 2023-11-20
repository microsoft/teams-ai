using static Microsoft.Teams.AI.AI.Prompts.PromptTemplate.PromptTemplateConfiguration.CompletionConfiguration;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Base model options common to both OpenAI and Azure OpenAI services.
    /// </summary>
    public abstract class BaseOpenAIModelOptions
    {
        /// <summary>
        /// Type of completion to use for the default model.
        /// </summary>
        public CompletionType CompletionType { get; set; }

        /// <summary>
        /// Whether to log requests to the console.
        /// </summary>
        /// <remarks>
        /// This is useful for debugging prompts.
        /// </remarks>
        public bool LogRequests { get; set; }

        /// <summary>
        /// Retry policy to use when calling the OpenAI API.
        /// </summary>
        /// <remarks>
        /// The default retry policy is `[2000, 5000]` which means that the first retry will be after
        /// 2 seconds and the second retry will be after 5 seconds.
        /// </remarks>
        public List<TimeSpan> RetryPolicy { get; set; }

        /// <summary>
        /// Whether to use `system` messages when calling the OpenAI API.
        /// </summary>
        /// <remarks>
        /// The current generation of models tend to follow instructions from `user` messages better
        /// then `system` messages so the default is `false`, which causes any `system` message in the
        /// prompt to be sent as `user` messages instead.
        /// </remarks>
        public bool UseSystemMessages { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="BaseOpenAIModelOptions"/> class.
        /// </summary>
        /// <param name="completionType">Type of completion to use for the default model.</param>
        /// <param name="logRequests">Whether to log requests to the console.</param>
        /// <param name="retryPolicy">Retry policy to use when calling the OpenAI API.</param>
        /// <param name="useSystemMessages"></param>
        protected BaseOpenAIModelOptions(
            CompletionType completionType = CompletionType.Chat,
            bool logRequests = false,
            List<TimeSpan>? retryPolicy = null,
            bool useSystemMessages = false)
        {
            this.CompletionType = completionType;
            this.LogRequests = logRequests;
            this.RetryPolicy = retryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) };
            this.UseSystemMessages = useSystemMessages;
        }
    }
}
