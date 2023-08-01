using Newtonsoft.Json;

namespace GPT.Model
{
    /// <summary>
    /// The strongly typed submit data for card invoke action
    /// </summary>
    public class SubmitData
    {
        [JsonProperty("post")]
        public string? Post { get; set; }

        [JsonProperty("prompt")]
        public string? Prompt { get; set; }

        [JsonProperty("verb")]
        public string? Verb { get; set; }
    }
}
