using Newtonsoft.Json;

namespace SearchCommand.Card
{
    /// <summary>
    /// The strongly typed NPM package model for Adaptive Card
    /// </summary>
    public class CardPackage
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
        public string? Keywords { get; set; }

        [JsonProperty("date")]
        public DateTime? Date { get; set; }

        [JsonProperty("author")]
        public string? Author { get; set; }

        [JsonProperty("publisher")]
        public string? Publisher { get; set; }

        [JsonProperty("maintainers")]
        public string? Maintainers { get; set; }

        [JsonProperty("npmLink")]
        public string? NpmLink { get; set; }

        [JsonProperty("homepageLink")]
        public string? HomepageLink { get; set; }

        [JsonProperty("repositoryLink")]
        public string? RepositoryLink { get; set; }

        [JsonProperty("bugsLink")]
        public string? BugsLink { get; set; }

        public static CardPackage Create(Package package)
        {
            return new CardPackage
            {
                Name = package.Name ?? string.Empty,
                Scope = package.Scope ?? string.Empty,
                Version = package.Version ?? string.Empty,
                Description = package.Description ?? string.Empty,
                Keywords = package.Keywords == null ? string.Empty : string.Join(", ", package.Keywords),
                Date = package.Date,
                Author = package.Author?.Name ?? string.Empty,
                Publisher = package.Publisher?.Username ?? string.Empty,
                Maintainers = package.Maintainers == null ? string.Empty : string.Join(", ", package.Maintainers.Select(m => m.Email)),
                NpmLink = package.Links?.Npm ?? string.Empty,
                HomepageLink = package.Links?.Homepage ?? string.Empty,
                RepositoryLink = package.Links?.Repository ?? string.Empty,
                BugsLink = package.Links?.Bugs ?? string.Empty
            };
        }
    }
}
