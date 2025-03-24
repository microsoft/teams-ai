using System.ComponentModel;
using System.Net.Http.Headers;
using AdaptiveCards;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.SemanticKernel;
using Newtonsoft.Json;
using OSSDevOpsAgent.Templates;
using OSSDevOpsAgent.Models;

namespace OSSDevOpsAgent
{
    public class GHPlugin : IRepositoryPlugin
    {
        /// <summary>
        /// Houses all the GitHub plugins.
        /// </summary>
        /// <param name="httpClient">The HTTP client used to make requests</param>
        /// <param name="config">The configuration pairs</param>
        public GHPlugin(HttpClient httpClient, ConfigOptions config) : base()
        {
            HttpClient = httpClient;
            Config = config;
        }

        [KernelFunction, Description("Lists the pull requests")]
        public override async Task<string> ListPRs(
            [Description("The turn context")] TurnContext context)
        {
            try
            {
                string owner = Config.GITHUB_OWNER;
                string repo = Config.GITHUB_REPOSITORY;
                string token = Config.AUTH_TOKEN;

                HttpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github.v3+json"));
                HttpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("token", token);
                HttpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Teams-Bot");

                string apiUrl = $"https://api.github.com/repos/{owner}/{repo}/pulls?state=all";
                HttpResponseMessage response = await HttpClient.GetAsync(apiUrl);

                if (response.IsSuccessStatusCode)
                {
                    string jsonContent = await response.Content.ReadAsStringAsync();
                    var currPullRequests = JsonConvert.DeserializeObject<List<GHPullRequest>>(jsonContent);

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

                    var card = GHAdaptiveCardBuilder.CreateListPRsAdaptiveCard("Pull Requests", currPullRequests, labels, assignees, authors);
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
            catch (Exception)
            {
                throw new Exception("Error accessing GitHub API");
            }
        }

        /// <summary>
        /// Filters the pull requests based on labels, assignees, and authors.
        /// </summary>
        /// <param name="labels">The labels used to filter</param>
        /// <param name="assignees">The assignees used to filter</param>
        /// <param name="authors">The authors used to filter</param>
        /// <param name="context">The turn context</param>
        /// <param name="pullRequests">The list of pull requests</param>
        /// <returns></returns>
        [KernelFunction, Description("Filters the pull requests")]
        public async Task<string> FilterPRs(
           [Description("The label filters")] string labels,
           [Description("The assignee filters")] string assignees,
           [Description("The author filters")] string authors,
           [Description("The turn context")] TurnContext context,
           [Description("The pull requests")] IList<GHPullRequest> pullRequests)
        {
            var labelsArr = string.IsNullOrEmpty(labels) ? new string[0] : labels.Split(',');
            var assigneesArr = string.IsNullOrEmpty(assignees) ? new string[0] : assignees.Split(',');
            var authorsArr = string.IsNullOrEmpty(authors) ? new string[0] : authors.Split(',');

            var filteredPullRequests = pullRequests.Where(pr =>
                (labelsArr.Length == 0 || pr.Labels.Any(label => labelsArr.Contains(label.Name))) &&
                (assigneesArr.Length == 0 || pr.Assignees.Any(assignee => assigneesArr.Contains(assignee.Login))) &&
                (authorsArr.Length == 0 || authorsArr.Contains(pr.User.Login))
            ).ToList();

            var card = GHAdaptiveCardBuilder.CreateFilterPRsAdaptiveCard("Filtered PRs", filteredPullRequests, labelsArr, assigneesArr, authorsArr);

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
