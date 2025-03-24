using Newtonsoft.Json;

namespace OSSDevOpsAgent.Models
{
    /// <summary>
    /// Manages the GitHub PRs and its associated filters for the
    /// Action.Submit on the ListOfPRs card
    /// </summary>
    public struct GHSubmitPRsActivity
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
        public IList<GHPullRequest> PullRequests { get; set; }
    }
}
