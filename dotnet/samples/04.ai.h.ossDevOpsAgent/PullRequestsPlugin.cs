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

        public PullRequestsPlugin(
            HttpClient httpClient,
            ConfigOptions config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        [KernelFunction, Description("Lists the pull requests")]
        public async Task<string> ListPRs(Kernel kernel)
        {
            try
            {
                string owner = _config.GITHUB_OWNER;
                string repo = _config.GITHUB_REPOSITORY;
                string token = _config.GITHUB_AUTH_TOKEN;

                // Configure request headers
                _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", token);
                _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Teams-Bot");

                string apiUrl = $"https://api.github.com/repos/{owner}/{repo}/pulls?state=all";
                HttpResponseMessage response = await _httpClient.GetAsync(apiUrl);

                if (response.IsSuccessStatusCode)
                {
                    string jsonContent = await response.Content.ReadAsStringAsync();
                    if (kernel.Data.TryGetValue("turnContext", out var turnContextObj))
                    {
                        TurnContext context = (TurnContext)turnContextObj;
                        var currPullRequests = JsonConvert.DeserializeObject<List<PullRequest>>(jsonContent);

                        var allLabels = new HashSet<string>();
                        var allAssignees = new HashSet<string>();
                        var allAuthors = new HashSet<string>();

                        foreach (var pr in currPullRequests)
                        {
                            if (!string.IsNullOrEmpty(pr.User.Login))
                            {
                                allAuthors.Add(pr.User.Login);
                            }

                            if (pr.Labels != null)
                            {
                                foreach (var label in pr.Labels)
                                {
                                    if (!string.IsNullOrEmpty(label.Name))
                                    {
                                        allLabels.Add(label.Name);
                                    }
                                }
                            }

                            if (pr.Assignees != null)
                            {
                                foreach (var assignee in pr.Assignees)
                                {
                                    if (!string.IsNullOrEmpty(assignee.Login))
                                    {
                                        allAssignees.Add(assignee.Login);
                                    }
                                }
                            }
                        }

                        var card = AdaptiveCardBuilder.CreateListPRsAdaptiveCard("Pull Requests", currPullRequests, allLabels, allAssignees, allAuthors);
                        var attachment = new Attachment
                        {
                            ContentType = AdaptiveCard.ContentType,
                            Content = card
                        };
                        var activity = MessageFactory.Attachment(attachment);

                        await context.SendActivityAsync(activity);

                        return JsonConvert.SerializeObject(activity);
                    }
                    throw new Exception("Turn context was not provided");
                }
                else
                {
                    // Handle error response
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
           [Description("The labels")] string labels,
           [Description("The assignees")] string assignees,
           [Description("The authors")] string authors,
           [Description("The turn context")] TurnContext context,
           [Description("The pull requests")] IList<PullRequest> pullRequests)
        {

            // Check if there are any pull requests to filter
            if (pullRequests == null || pullRequests.Count == 0)
            {
                return "No pull requests available to filter.";
            }

            // Split the comma-separated strings into arrays
            var labelArray = string.IsNullOrEmpty(labels) ? new string[0] : labels.Split(',').Select(l => l.Trim()).ToArray();
            var assigneeArray = string.IsNullOrEmpty(assignees) ? new string[0] : assignees.Split(',').Select(a => a.Trim()).ToArray();
            var authorArray = string.IsNullOrEmpty(authors) ? new string[0] : authors.Split(',').Select(a => a.Trim()).ToArray();

            // Filter the pull requests based on the provided criteria
            var filteredPullRequests = pullRequests.Where(pr =>
                (labelArray.Length == 0 || pr.Labels.Any(label => labelArray.Contains(label.Name))) &&
                (assigneeArray.Length == 0 || pr.Assignees.Any(assignee => assigneeArray.Contains(assignee.Login))) &&
                (authorArray.Length == 0 || authorArray.Contains(pr.User.Login))
            ).ToList();

            // Check if any pull requests match the criteria
            if (filteredPullRequests.Count == 0)
            {
                return "No pull requests match the selected filters.";
            }

            // Create the adaptive card for the filtered pull requests
            var card = AdaptiveCardBuilder.CreateFilterPRsAdaptiveCard("Filtered Pull Requests", filteredPullRequests);

            var attachment = new Attachment
            {
                ContentType = AdaptiveCard.ContentType,
                Content = card
            };

            // TODO: Add to ChatHistory
            await context.SendActivityAsync(MessageFactory.Attachment(attachment));

            return "Filtered pull requests displayed.";
        }

        [KernelFunction, Description("Retrieves a specific pull request")]
        public async Task<string> GetPR(
            [Description("The id of the pull request")] string pull_request_id)
        {
            try
            {
                string owner = _config.GITHUB_OWNER;
                string repo = _config.GITHUB_REPOSITORY;
                string token = _config.GITHUB_AUTH_TOKEN;

                // Fetch pull request data directly within the action
                _httpClient.DefaultRequestHeaders.Add("Authorization", $"token {token}");
                _httpClient.DefaultRequestHeaders.Add("Accept", "application/vnd.github.v3+json");
                _httpClient.DefaultRequestHeaders.Add("User-Agent", "Teams-Bot");

                var response = await _httpClient.GetAsync($"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_request_id}");

                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    Console.Error.WriteLine("GitHub API Error Details:", new
                    {
                        status = (int)response.StatusCode,
                        statusText = response.ReasonPhrase,
                        body = errorBody
                    });
                    throw new Exception($"GitHub API returned {(int)response.StatusCode}: {errorBody}");
                }

                var prDataJson = await response.Content.ReadAsStringAsync();
                return prDataJson;
            }
            catch (Exception ex)
            {
                return "Error accessing GitHub API";
            }
        }
    }
}
