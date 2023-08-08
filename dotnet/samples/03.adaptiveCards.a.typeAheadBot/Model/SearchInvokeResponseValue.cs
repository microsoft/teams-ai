using Newtonsoft.Json;

namespace TypeAheadBot.Model
{
    public class SearchInvokeResponseValue
    {
        [JsonProperty("results")]
        public IList<AdaptiveCardSearchResult>? Results { get; set; }
    }
}
