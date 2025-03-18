using Newtonsoft.Json;

namespace OSSDevOpsAgent.Model
{
    public class PullRequestFilters
    {
        [JsonProperty("labelFilter")]
        public string LabelFilter { get; set; }

        [JsonProperty("assigneeFilter")]
        public string AssigneeFilter { get; set; }

        [JsonProperty("authorFilter")]
        public string AuthorFilter { get; set; }

        [JsonProperty("pullRequests")]
        public IList<PullRequest> PullRequests { get; set; }
    }
}
