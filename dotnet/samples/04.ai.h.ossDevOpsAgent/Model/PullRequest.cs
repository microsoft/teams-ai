using Newtonsoft.Json;

namespace OSSDevOpsAgent.Model
{
    /// <summary>
    /// Defines a PR
    /// </summary>
    public struct PullRequest
    {
        [JsonProperty("title")]
        public string Title { get; set; }
        [JsonProperty("number")]
        public int Number { get; set; }
        [JsonProperty("state")]
        public string State { get; set; }
        [JsonProperty("user")]
        public PRUser User { get; set; }
        [JsonProperty("created_at")]
        public DateTime CreatedAt { get; set; }
        [JsonProperty("html_url")]
        public string HtmlUrl { get; set; }
        [JsonProperty("labels")]
        public IList<PRLabel> Labels { get; set; }
        [JsonProperty("assignees")]
        public IList<PRUser> Assignees { get; set; }
        [JsonProperty("body")]
        public string Body { get; set; }
    }

}
