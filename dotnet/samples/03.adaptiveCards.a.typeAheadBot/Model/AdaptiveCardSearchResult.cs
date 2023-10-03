using Newtonsoft.Json;

namespace TypeAheadBot.Model
{
    public class AdaptiveCardSearchResult
    {
        [JsonProperty("title")]
        public string? Title { get; set; }

        [JsonProperty("value")]
        public string? Value { get; set; }
    }
}
