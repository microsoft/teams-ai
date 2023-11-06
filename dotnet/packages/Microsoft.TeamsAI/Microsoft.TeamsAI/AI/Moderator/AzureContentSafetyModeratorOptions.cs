using Azure.AI.ContentSafety;

namespace Microsoft.Teams.AI.AI.Moderator
{
    /// <summary>
    /// Options for the Azure Content Safety moderator.
    /// </summary>
    public class AzureContentSafetyModeratorOptions
    {
        /// <summary>
        /// Azure Content Safety API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Azure Content Safety API endpoint.
        /// </summary>
        public string Endpoint { get; set; }

        /// <summary>
        /// Which parts of the conversation to moderate
        /// </summary>
        public ModerationType Moderate { get; set; }

        /// <summary>
        /// The severity level that triggers a flagged response. Default value is 2.
        /// </summary>
        public int SeverityLevel { get; set; } = 2;

        /// <summary>
        /// The categories will be analyzed. If not assigned, a default set of the categories' analysis results will be returned.
        /// </summary>
        public IList<TextCategory>? Categories { get; set; }

        /// <summary>
        /// The names of blocklists.
        /// </summary>
        public IList<string>? BlocklistNames { get; set; }

        /// <summary>
        /// When set to true, further analyses of harmful content will not be performed in cases where blocklists are hit. When set to false, all analyses of harmful content will be performed, whether or not blocklists are hit.
        /// </summary>
        public bool? BreakByBlocklists { get; set; }

        /// <summary>
        /// Create an instance of the AzureContentSafetyModeratorOptions class.
        /// </summary>
        /// <param name="apiKey">Azure Content Safety API key.</param>
        /// <param name="endpoint">Azure Content Safety endpoint.</param>
        /// <param name="moderate">Which parts of the conversation to moderate.</param>
        public AzureContentSafetyModeratorOptions(string apiKey, string endpoint, ModerationType moderate)
        {
            ApiKey = apiKey;
            Endpoint = endpoint;
            Moderate = moderate;
        }
    }
}
