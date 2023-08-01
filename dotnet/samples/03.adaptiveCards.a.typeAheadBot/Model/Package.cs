using Newtonsoft.Json;

namespace TypeAheadBot.Model
{
    /// <summary>
    /// The strongly typed NuGet package search result
    /// </summary>
    public class Package
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("description")]
        public string? Description { get; set; }
    }
}
