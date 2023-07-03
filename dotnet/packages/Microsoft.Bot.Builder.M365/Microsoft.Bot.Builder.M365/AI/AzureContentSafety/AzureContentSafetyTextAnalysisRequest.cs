using System.Text.Json.Serialization;

namespace Microsoft.Bot.Builder.M365.AI.AzureContentSafety
{
    public class AzureContentSafetyTextAnalysisRequest
    {
        /// <summary>
        /// The text needs to be scanned.
        /// </summary>
        [JsonPropertyName("text")]
        public string Text { get; set; }

        /// <summary>
        /// The categories will be analyzed.
        /// </summary>
        [JsonPropertyName("categories")]
        public List<AzureContentSafetyHarmCategory>? Categories { get; set; }

        /// <summary>
        /// The names of blocklists.
        /// </summary>
        [JsonPropertyName("blocklistNames")]
        public List<string>? BlocklistNames { get; set; }

        /// <summary>
        /// When set to true, further analyses of harmful content will not be performed in cases where blocklists are hit.
        /// When set to false, all analyses of harmful content will be performed, whether or not blocklists are hit.
        /// </summary>
        [JsonPropertyName("breakByBlocklists")]
        public bool? BreakByBlocklists { get; set; }

        public AzureContentSafetyTextAnalysisRequest(string text)
        {
            Text = text;
        }
    }
}
