namespace OSSDevOpsAgent
{
    public class ConfigOptions
    {
        public string BOT_ID { get; set; }
        public string BOT_PASSWORD { get; set; }
        public string BOT_DOMAIN { get; set; }
        public string AAD_APP_CLIENT_ID { get; set; }
        public string AAD_APP_CLIENT_SECRET { get; set; }
        public string AAD_APP_TENANT_ID { get; set; }
        public string AAD_APP_OAUTH_AUTHORITY_HOST { get; set; }
        public string OAUTH_CONNECTION_NAME { get; set; }
        public string GITHUB_OWNER { get; set; }
        public string GITHUB_REPOSITORY { get; set; }
        public string GITHUB_CLIENT_ID { get; set; }
        public string GITHUB_CLIENT_SECRET { get; set; }
        public string GITHUB_AUTH_TOKEN { get; set; }
        public AzureConfigOptions Azure { get; set; }
    }

    /// <summary>
    /// Options for Azure OpenAI
    /// </summary>
    public class AzureConfigOptions
    {
        public string OpenAIApiKey { get; set; }
        public string OpenAIEndpoint { get; set; }
        public string OpenAIDeploymentName { get; set; }
    }
}
