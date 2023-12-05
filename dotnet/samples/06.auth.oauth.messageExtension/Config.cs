namespace MessageExtensionAuth
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
    }
}
