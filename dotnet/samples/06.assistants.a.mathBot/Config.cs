namespace OrderBot
{
    public class ConfigOptions
    {
        public string? BOT_ID { get; set; }
        public string? BOT_PASSWORD { get; set; }
        public OpenAIConfigOptions? OpenAI { get; set; }
        public AzureConfigOptions? Azure { get; set; }
    }

    /// <summary>
    /// Options for OpenAI
    /// </summary>
    public class OpenAIConfigOptions
    {
        public string? ApiKey { get; set; }
        public string? AssistantId { get; set; }
    }

    /// <summary>
    /// Options for Azure
    /// </summary>
    public class AzureConfigOptions
    {
        public string? OpenAIApiKey { get; set; }
        public string? OpenAIEndpoint { get; set; }
        public string? OpenAIAssistantId { get; set; }
    }
}
