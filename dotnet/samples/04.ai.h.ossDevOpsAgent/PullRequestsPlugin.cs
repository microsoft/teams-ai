using System.ComponentModel;
using System.Net.Http.Headers;
using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.SemanticKernel;
using Newtonsoft.Json;
using OSSDevOpsAgent.Model;

namespace OSSDevOpsAgent
{
    public class PullRequestsPlugin
    {
        private HttpClient _httpClient;
        private ConfigOptions _config;

        /// <summary>
        /// Houses all the PR plugins.
        /// </summary>
        /// <param name="httpClient">The HTTP client used to make requests</param>
        /// <param name="config">The configuration pairs</param>
        public PullRequestsPlugin(
            HttpClient httpClient,
            ConfigOptions config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        [KernelFunction, Description("Lists the pull requests")]
        public async Task<string> ListPRs(
            [Description("The turn context")] TurnContext context)
        {
            try
            {
                string owner = _config.GITHUB_OWNER;
                string repo = _config.GITHUB_REPOSITORY;
                string token = _config.GITHUB_AUTH_TOKEN;

                _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", token);
                _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Teams-Bot");

                string apiUrl = $"https://api.github.com/repos/{owner}/{repo}/pulls?state=all";
                HttpResponseMessage response = await _httpClient.GetAsync(apiUrl);

                if (response.IsSuccessStatusCode)
                {
                    string jsonContent = await response.Content.ReadAsStringAsync();
                    var currPullRequests = JsonConvert.DeserializeObject<List<PullRequest>>(jsonContent);

                    var labels = new HashSet<string>();
                    var assignees = new HashSet<string>();
                    var authors = new HashSet<string>();

                    foreach (var pr in currPullRequests)
                    {
                        if (!string.IsNullOrEmpty(pr.User.Login))
                        {
                            authors.Add(pr.User.Login);
                        }

                        if (pr.Labels != null)
                        {
                            foreach (var label in pr.Labels)
                            {
                                if (!string.IsNullOrEmpty(label.Name))
                                {
                                    labels.Add(label.Name);
                                }
                            }
                        }

                        if (pr.Assignees != null)
                        {
                            foreach (var assignee in pr.Assignees)
                            {
                                if (!string.IsNullOrEmpty(assignee.Login))
                                {
                                    assignees.Add(assignee.Login);
                                }
                            }
                        }
                    }

                    var card = AdaptiveCardBuilder.CreateListPRsAdaptiveCard("Pull Requests", currPullRequests, labels, assignees, authors);
                    var attachment = new Attachment
                    {
                        ContentType = AdaptiveCard.ContentType,
                        Content = card
                    };
                    var activity = MessageFactory.Attachment(attachment);
                    await context.SendActivityAsync(activity);
                    return JsonConvert.SerializeObject(activity);
                }
                else
                {
                    string errorBody = await response.Content.ReadAsStringAsync();
                    Console.Error.WriteLine($"GitHub API Error Details: Status: {response.StatusCode}, " +
                                           $"Reason: {response.ReasonPhrase}, Body: {errorBody}");

                    throw new Exception($"GitHub API returned {response.StatusCode}: {errorBody}");
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error accessing GitHub API");
            }
        }

        [KernelFunction, Description("Filters the pull requests")]
        public async Task<string> FilterPRs(
           [Description("The label filters")] string labels,
           [Description("The assignee filters")] string assignees,
           [Description("The author filters")] string authors,
           [Description("The turn context")] TurnContext context,
           [Description("The pull requests")] IList<PullRequest> pullRequests)
        {
            var labelsArr = string.IsNullOrEmpty(labels) ? new string[0] : labels.Split(',');
            var assigneesArr = string.IsNullOrEmpty(assignees) ? new string[0] : assignees.Split(',');
            var authorsArr = string.IsNullOrEmpty(authors) ? new string[0] : authors.Split(',');

            // Filter the pull requests based on the provided criteria
            var filteredPullRequests = pullRequests.Where(pr =>
                (labelsArr.Length == 0 || pr.Labels.Any(label => labelsArr.Contains(label.Name))) &&
                (assigneesArr.Length == 0 || pr.Assignees.Any(assignee => assigneesArr.Contains(assignee.Login))) &&
                (authorsArr.Length == 0 || authorsArr.Contains(pr.User.Login))
            ).ToList();

            var card = AdaptiveCardBuilder.CreateFilterPRsAdaptiveCard("Filtered PRs", filteredPullRequests, labelsArr, assigneesArr, authorsArr);

            var attachment = new Attachment
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card
            };

            var activity = MessageFactory.Attachment(attachment);
            await context.SendActivityAsync(activity);
            return JsonConvert.SerializeObject(activity);
        }
    }
}
