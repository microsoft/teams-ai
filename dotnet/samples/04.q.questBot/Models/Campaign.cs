using System.Text.Json.Serialization;

namespace QuestBot.Models
{
    public class Campaign
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("playerIntro")]
        public string PlayerIntro { get; set; } = string.Empty;

        [JsonInclude]
        [JsonPropertyName("objectives")]
#pragma warning disable CA2227 // Collection properties should be read only (public setter for JSON serializer)
        public IList<CampaignObjective> Objectives { get; set; } = Array.Empty<CampaignObjective>();
#pragma warning restore CA2227 // Collection properties should be read only
    }
}
