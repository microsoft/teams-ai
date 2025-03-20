
namespace OSSDevOpsAgent
{
    /// <summary>
    /// Defines a Teams conversation,
    /// referenced for history
    /// </summary>
    public class ConversationInfo
    {
        public string BotId { get; set; }
        public string Id { get; set; }
        public string ServiceUrl { get; set; }
        public string ChatHistory { get; set; }
        public bool IsGroup { get; set; }
        public string TeamId { get; set; }
        public string ChannelId { get; set; }
    }
}
