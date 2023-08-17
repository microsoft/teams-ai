namespace Microsoft.TeamsAI.Tests.IntegrationTests
{
    internal class AzureContentSafetyConfiguration
    {
        public string ApiKey { get; set; } = string.Empty;
        public string Endpoint { get; set; } = string.Empty;

        public AzureContentSafetyConfiguration(string apiKey, string endpoint)
        {
            ApiKey = apiKey;
            Endpoint = endpoint;
        }

        public AzureContentSafetyConfiguration() { }
    }
}
