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
        public IList<CampaignObjective> Objectives { get; private set; } = Array.Empty<CampaignObjective>();
    }
}
