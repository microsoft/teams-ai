namespace TwentyQuestions
{
    public class ConfigOptions
    {
        public string? BOT_ID { get; set; }
        public string? BOT_PASSWORD { get; set; }
        public OpenAIConfigOptions? OpenAI { get; set; }
        public AzureOpenAIConfigOptions? AzureOpenAI { get; set; }
    }

    public class OpenAIConfigOptions
    {
        public string? ApiKey { get; set; }
    }

    public class AzureOpenAIConfigOptions
    {
        public string? ApiKey { get; set; }
        public string? Endpoint { get; set; }
        public string? ContentSafetyApiKey { get; set; }
        public string? ContentSafetyEndpoint { get; set; }
    }
}
