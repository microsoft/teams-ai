namespace Microsoft.Teams.AI.Tests.IntegrationTests
{
    internal sealed class OpenAIConfiguration
    {
        public string ModelId { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string? ChatModelId { get; set; }

        public OpenAIConfiguration(string modelId, string? chatModelId, string apiKey)
        {
            ModelId = modelId;
            ChatModelId = chatModelId;
            ApiKey = apiKey;
        }

        public OpenAIConfiguration() { }
    }
}
