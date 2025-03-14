﻿namespace ChatModeration
{
    public class ConfigOptions
    {
        public string? BOT_ID { get; set; }
        public string? BOT_PASSWORD { get; set; }
        public OpenAIConfigOptions? OpenAI { get; set; }
        public AzureConfigOptions? Azure { get; set; }
    }

    /// <summary>
    /// Options for Open AI
    /// </summary>
    public class OpenAIConfigOptions
    {
        public string? ApiKey { get; set; }
    }

    /// <summary>
    /// Options for Azure OpenAI and Azure Content Safety
    /// </summary>
    public class AzureConfigOptions
    {
        public string? OpenAIApiKey { get; set; }
        public string? OpenAIEndpoint { get; set; }
        public string? ContentSafetyApiKey { get; set; }
        public string? ContentSafetyEndpoint { get; set; }
    }
}
