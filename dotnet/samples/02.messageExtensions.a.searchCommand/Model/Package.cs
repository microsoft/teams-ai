using Newtonsoft.Json;

namespace SearchCommand.Model
{
    /// <summary>
    /// The strongly typed NuGet package search result
    /// </summary>
    public class Package
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("version")]
        public string? Version { get; set; }

        [JsonProperty("description")]
        public string? Description { get; set; }

        [JsonProperty("tags")]
        public string[]? Tags { get; set; }

        [JsonProperty("authors")]
        public string[]? Authors { get; set; }

        [JsonProperty("owners")]
        public string[]? Owners { get; set; }

        [JsonProperty("iconUrl")]
        public string? IconUrl { get; set; }

        [JsonProperty("licenseUrl")]
        public string? LicenseUrl { get; set; }

        [JsonProperty("projectUrl")]
        public string? ProjectUrl { get; set; }

        [JsonProperty("packageTypes")]
        public object[]? PackageTypes { get; set; }
    }
}
