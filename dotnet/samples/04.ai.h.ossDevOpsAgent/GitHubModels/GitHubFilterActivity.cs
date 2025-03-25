using Newtonsoft.Json;

namespace DevOpsAgent.GitHubModels
{
    /// <summary>
    /// Manages the GitHub PRs and its associated filters for the
    /// Action.Submit on the ListOfPRs card
    /// </summary>
    public struct GitHubFilterActivity
    {
        /// <summary>
        /// The filter for the PR labels
        /// </summary>
        [JsonProperty("labelFilter")]
        public string LabelFilter { get; set; }

        /// <summary>
        /// The filter for the PR assignees
        /// </summary>
        [JsonProperty("assigneeFilter")]
        public string AssigneeFilter { get; set; }

        /// <summary>
        /// The filter for the PR authors
        /// </summary>
        [JsonProperty("authorFilter")]
        public string AuthorFilter { get; set; }

        /// <summary>
        /// The list of pull requests
        /// </summary>
        [JsonProperty("pullRequests")]
        public IList<GitHubPR> PullRequests { get; set; }
    }
}
