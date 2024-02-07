namespace Microsoft.Teams.AI.Tests.IntegrationTests
{
    internal sealed class OpenAIConfiguration
    {
        public string ModelId { get; set; } = string.Empty;
        public string ApiKey { get; set; } = string.Empty;
        public string? ChatModelId { get; set; }
        public string? EmbeddingModelId { get; set; }

        public OpenAIConfiguration(string modelId, string? chatModelId, string? embeddingModelId, string apiKey)
        {
            ModelId = modelId;
            ChatModelId = chatModelId;
            EmbeddingModelId = embeddingModelId;
            ApiKey = apiKey;
        }

        public OpenAIConfiguration() { }
    }
}
