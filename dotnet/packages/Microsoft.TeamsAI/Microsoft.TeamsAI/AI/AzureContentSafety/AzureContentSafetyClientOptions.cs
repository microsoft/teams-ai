namespace Microsoft.TeamsAI.AI.AzureContentSafety
{
    /// <summary>
    /// Options for the Azure Content Safety client.
    /// </summary>
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

        /// <summary>
        /// Creates a new instance of the <see cref="AzureContentSafetyClientOptions"/> class.
        /// </summary>
        /// <param name="apiKey">The API key.</param>
        /// <param name="endpoint">The Azure endpoint.</param>
        public AzureContentSafetyClientOptions(string apiKey, string endpoint)
        {
            ApiKey = apiKey;
            Endpoint = endpoint;
        }
    }
}
