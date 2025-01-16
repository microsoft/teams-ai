namespace BotAuth
{
    public class ConfigOptions
    {
        public string BOT_ID { get; set; }
        public string BOT_TENANT { get; set; }
        public string BOT_DOMAIN { get; set; }
        public string AAD_APP_CLIENT_ID => BOT_ID;
        public string AAD_APP_TENANT_ID => BOT_TENANT;

    }
}
