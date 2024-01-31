namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Base embeddings options common to both OpenAI and Azure OpenAI services.
    /// </summary>
    public class BaseOpenAIEmbeddingsOptions
    {
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
    }
}
