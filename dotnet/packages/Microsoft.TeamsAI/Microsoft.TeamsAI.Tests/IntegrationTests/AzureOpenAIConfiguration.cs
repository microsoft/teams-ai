namespace Microsoft.Teams.AI.Tests.IntegrationTests
{
    internal sealed class AzureOpenAIConfiguration
    {
        public string ModelId { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string? ChatModelId { get; set; }
        public string Endpoint { get; set; } = string.Empty;

        public AzureOpenAIConfiguration(string modelId, string? chatModelId, string apiKey, string endpoint)
        {
            ModelId = modelId;
            ChatModelId = chatModelId;
            ApiKey = apiKey;
            Endpoint = endpoint;
        }

        public AzureOpenAIConfiguration() { }
    }
}
