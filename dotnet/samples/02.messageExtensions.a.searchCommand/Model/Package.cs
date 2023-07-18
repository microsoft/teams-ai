using Newtonsoft.Json;

namespace SearchCommand.Card
{
    /// <summary>
    /// The strongly typed NPM package search result
    /// </summary>
    public class Package
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("scope")]
        public string? Scope { get; set; }

        [JsonProperty("version")]
        public string? Version { get; set; }

        [JsonProperty("description")]
        public string? Description { get; set; }

        [JsonProperty("keywords")]
        public string[]? Keywords { get; set; }

        [JsonProperty("date")]
        public DateTime? Date { get; set; }

        [JsonProperty("links")]
        public PackageLinks? Links { get; set; }

        [JsonProperty("author")]
        public People? Author { get; set; }

        [JsonProperty("publisher")]
        public People? Publisher { get; set; }

        [JsonProperty("maintainers")]
        public People[]? Maintainers { get; set; }
    }

    public class PackageLinks
    {
        [JsonProperty("npm")]
        public string? Npm { get; set; }

        [JsonProperty("homepage")]
        public string? Homepage { get; set; }

        [JsonProperty("repository")]
        public string? Repository { get; set; }

        [JsonProperty("bugs")]
        public string? Bugs { get; set; }
    }

    public class People
    {
        [JsonProperty("name")]
        public string? Name { get; set; }

        [JsonProperty("email")]
        public string? Email { get; set; }

        [JsonProperty("url")]
        public string? Url { get; set; }

        [JsonProperty("username")]
        public string? Username { get; set; }
    }
}
