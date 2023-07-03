using System.Text.Json.Serialization;

namespace Microsoft.Bot.Builder.M365.AI.OpenAI
{
    public class AzureContentSafetyTextAnalysisResponse
    {
        /// <summary>
        /// The result of blocklist match.
        /// </summary>
        [JsonPropertyName("blocklistsMatchResults")]
        public List<AzureContentSafetyTextAnalysisBlocklistsMatch> BlocklistsMatchResults { get; set; } = new List<AzureContentSafetyTextAnalysisBlocklistsMatch>();

        /// <summary>
        /// Analysis result for Hate category.
        /// </summary>
        [JsonPropertyName("hateResult")]
        public AzureContentSafetyHarmCategoryResult? HateResult { get; set; }

        /// <summary>
        /// Analysis result for SelfHarm category.
        /// </summary>
        [JsonPropertyName("selfHarmResult")]
        public AzureContentSafetyHarmCategoryResult? SelfHarmResult { get; set; }

        /// <summary>
        /// Analysis result for Sexual category.
        /// </summary>
        [JsonPropertyName("sexualResult")]
        public AzureContentSafetyHarmCategoryResult? SexualResult { get; set; }

        /// <summary>
        /// Analysis result for Violence category.
        /// </summary>
        [JsonPropertyName("violenceResult")]
        public AzureContentSafetyHarmCategoryResult? ViolenceResult { get; set; }
    }

    public class AzureContentSafetyTextAnalysisBlocklistsMatch
    {
        /// <summary>
        /// The name of matched blocklist.
        /// </summary>
        [JsonPropertyName("blocklistName")]
        public string BlocklistName { get; set; }

        /// <summary>
        /// The id of matched item.
        /// </summary>
        [JsonPropertyName("blockItemId")]
        public string BlockItemId { get; set; }

        /// <summary>
        /// The content of matched item.
        /// </summary>
        [JsonPropertyName("blockItemText")]
        public string BlockItemText { get; set; }

        /// <summary>
        /// The character offset of matched text in original input.
        /// </summary>
        [JsonPropertyName("offset")]
        public int Offset { get; set; }

        /// <summary>
        /// The length of matched text in original input.
        /// </summary>
        [JsonPropertyName("length")]
        public int Length { get; set; }
    }
}
