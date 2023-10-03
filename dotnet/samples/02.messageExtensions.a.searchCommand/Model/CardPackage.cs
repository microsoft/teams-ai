using Newtonsoft.Json;

namespace SearchCommand.Model
{
    /// <summary>
    /// The strongly typed NuGet package model for Adaptive Card
    /// </summary>
    public class CardPackage
    {
        [JsonProperty("id")]
        public string? Id { get; set; }

        [JsonProperty("version")]
        public string? Version { get; set; }

        [JsonProperty("description")]
        public string? Description { get; set; }

        [JsonProperty("tags")]
        public string? Tags { get; set; }

        [JsonProperty("authors")]
        public string? Authors { get; set; }

        [JsonProperty("owners")]
        public string? Owners { get; set; }

        [JsonProperty("licenseUrl")]
        public string? LicenseUrl { get; set; }

        [JsonProperty("projectUrl")]
        public string? ProjectUrl { get; set; }

        [JsonProperty("nugetUrl")]
        public string? NuGetUrl { get; set; }

        public static CardPackage Create(Package package)
        {
            return new CardPackage
            {
                Id = package.Id ?? string.Empty,
                Version = package.Version ?? string.Empty,
                Description = package.Description ?? string.Empty,
                Tags = package.Tags == null ? string.Empty : string.Join(", ", package.Tags),
                Authors = package.Authors == null ? string.Empty : string.Join(", ", package.Authors),
                Owners = package.Owners == null ? string.Empty : string.Join(", ", package.Owners),
                LicenseUrl = package.LicenseUrl ?? string.Empty,
                ProjectUrl = package.ProjectUrl ?? string.Empty,
                NuGetUrl = $"https://www.nuget.org/packages/{package.Id}"
            };
        }
    }
}
