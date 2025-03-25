using Newtonsoft.Json;

namespace DevOpsAgent.GitHubModels
{
    /// <summary>
    /// Defines a GitHub pull request
    /// </summary>
    public struct GitHubPR
    {
        /// <summary>
        /// The title of the PR
        /// </summary>
        [JsonProperty("title")]
        public string Title { get; set; }
        /// <summary>
        /// The number assigned to the PR
        /// </summary>
        [JsonProperty("number")]
        public int Number { get; set; }
        /// <summary>
        /// The state of the PR.
        /// </summary>
        [JsonProperty("state")]
        public string State { get; set; }
        /// <summary>
        /// The user who created the PR
        /// </summary>
        [JsonProperty("user")]
        public GitHubUser User { get; set; }
        /// <summary>
        /// The date the PR was created
        /// </summary>
        [JsonProperty("created_at")]
        public DateTime CreatedAt { get; set; }
        /// <summary>
        /// The link to the PR
        /// </summary>
        [JsonProperty("html_url")]
        public string HtmlUrl { get; set; }
        /// <summary>
        /// The labels for the PR
        /// </summary>
        [JsonProperty("labels")]
        public IList<GitHubLabel> Labels { get; set; }
        /// <summary>
        /// The assignees for the PR
        /// </summary>
        [JsonProperty("assignees")]
        public IList<GitHubUser> Assignees { get; set; }
        /// <summary>
        /// The contents of the PR
        /// </summary>
        [JsonProperty("body")]
        public string Body { get; set; }
    }

}
