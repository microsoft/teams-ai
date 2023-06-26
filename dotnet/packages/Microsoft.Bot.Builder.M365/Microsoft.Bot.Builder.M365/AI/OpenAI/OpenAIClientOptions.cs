namespace Microsoft.Bot.Builder.M365.OpenAI
{
    public class OpenAIClientOptions
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
        /// The default model to use.
        /// </summary>
        /// <remarks>
        /// Prompts can override this model.
        /// </remarks>
        public string DefaultModel { get; set; }

        /// <summary>
        /// Create an instance of the OpenAIModeratorOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="defaultModel">The default model to use.</param>
        public OpenAIClientOptions(string apiKey, string defaultModel)
        {
            ApiKey = apiKey;
            DefaultModel = defaultModel;
        }
    }
}
