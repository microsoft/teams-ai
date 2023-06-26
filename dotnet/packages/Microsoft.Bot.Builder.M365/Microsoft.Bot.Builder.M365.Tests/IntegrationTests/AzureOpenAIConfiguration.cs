
namespace Microsoft.Bot.Builder.M365.Tests.Integration
{
    internal class AzureOpenAIConfiguration
    {
        public string ModelId { get; set; }
        public string ApiKey { get; set; }
        public string? ChatModelId { get; set; }
        public string Endpoint { get; set; }

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
