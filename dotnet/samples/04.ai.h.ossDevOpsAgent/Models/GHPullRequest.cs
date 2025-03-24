using Newtonsoft.Json;

namespace OSSDevOpsAgent.Models
{
    /// <summary>
    /// Defines a GitHub pull request
    /// </summary>
    public struct GHPullRequest
    {
        [JsonProperty("title")]
        public string Title { get; set; }
        [JsonProperty("number")]
        public int Number { get; set; }
        [JsonProperty("state")]
        public string State { get; set; }
        [JsonProperty("user")]
        public GHUser User { get; set; }
        [JsonProperty("created_at")]
        public DateTime CreatedAt { get; set; }
        [JsonProperty("html_url")]
        public string HtmlUrl { get; set; }
        [JsonProperty("labels")]
        public IList<GHPullRequestLabel> Labels { get; set; }
        [JsonProperty("assignees")]
        public IList<GHUser> Assignees { get; set; }
        [JsonProperty("body")]
        public string Body { get; set; }
    }

}
