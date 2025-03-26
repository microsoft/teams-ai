using Newtonsoft.Json;

namespace DevOpsAgent.GitHubModels
{
    /// <summary>
    /// Activity for filtering the list of PRs.
    /// </summary>
    public struct GitHubFilterActivity
    {
        /// <summary>
        /// The filter for the PR labels.
        /// </summary>
        [JsonProperty("labelFilter")]
        public string LabelFilter { get; set; }

        /// <summary>
        /// The filter for the PR assignees.
        /// </summary>
        [JsonProperty("assigneeFilter")]
        public string AssigneeFilter { get; set; }

        /// <summary>
        /// The filter for the PR authors.
        /// </summary>
        [JsonProperty("authorFilter")]
        public string AuthorFilter { get; set; }

        /// <summary>
        /// The list of pull requests to filter.
        /// </summary>
        [JsonProperty("pullRequests")]
        public IList<GitHubPR> PullRequests { get; set; }
    }
}
