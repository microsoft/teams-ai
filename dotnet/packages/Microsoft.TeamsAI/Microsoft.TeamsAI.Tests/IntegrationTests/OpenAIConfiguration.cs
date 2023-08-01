
namespace Microsoft.TeamsAI.Tests.Integration
{
    internal class OpenAIConfiguration
    {
        public string ModelId { get; set; }
        public string ApiKey { get; set; }
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
