using Newtonsoft.Json;

namespace TypeAheadBot.Model
{
    public class AdaptiveCardSubmitData
    {
        [JsonProperty("verb")]
        public string? Verb { get; set; }

        [JsonProperty("ChoiceSelect")]
        public string? ChoiceSelect { get; set; }
    }
}
