namespace Microsoft.Teams.AI.AI.OpenAI
{
    /// <summary>
    /// Options for the OpenAI client.
    /// </summary>
    internal class OpenAIClientOptions
    {
        /// <summary>
        /// OpenAI API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Optional. OpenAI organization.
        /// </summary>
        public string? Organization { get; set; }

        /// <summary>
        /// Create an instance of the OpenAIModeratorOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        public OpenAIClientOptions(string apiKey)
        {
            ApiKey = apiKey;
        }
    }
}
