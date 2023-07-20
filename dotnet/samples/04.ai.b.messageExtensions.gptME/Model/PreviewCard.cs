using Newtonsoft.Json;

namespace GPT.Model
{
    /// <summary>
    /// The strongly typed content of previewed card
    /// </summary>
    public class PreviewCard
    {
        [JsonProperty("body")]
        public TextBlock[]? Body { get; set; }
    }

    public class TextBlock
    {
        [JsonProperty("text")]
        public string? Text { get; set; }

        [JsonProperty("type")]
        public string? Type { get; set; }
    }
}
