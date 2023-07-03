namespace Microsoft.Bot.Builder.M365.AI.OpenAI
{
    public class AzureContentSafetyClientOptions
    {
        /// <summary>
        /// Azure Content Safety API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Azure Content Safety endpoint.
        /// </summary>
        public string Endpoint { get; set; }

        /// <summary>
        /// Azure Content Safety API version.
        /// </summary>
        public string? ApiVersion { get; set; }

        public AzureContentSafetyClientOptions(string apiKey, string endpoint)
        {
            ApiKey = apiKey;
            Endpoint = endpoint;
        }
    }
}
