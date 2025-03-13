using System.ComponentModel;
using System.Net.Http.Headers;
using Microsoft.SemanticKernel;

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
        public async Task<string> ListPRs()
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
                    return jsonContent;
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
                return "Error accessing GitHub API";
            }
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
