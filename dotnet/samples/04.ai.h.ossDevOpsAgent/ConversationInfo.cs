
namespace DevOpsAgent
{
    /// <summary>
    /// Defines a Teams conversation,
    /// referenced for history
    /// </summary>
    public class ConversationInfo
    {
        /// <summary>
        /// The ID of the bot
        /// </summary>
        public string BotId { get; set; }
        /// <summary>
        /// The ID of the conversation
        /// </summary>
        public string Id { get; set; }
        /// <summary>
        /// The service url of the conversation
        /// </summary>
        public string ServiceUrl { get; set; }
        /// <summary>
        /// The chat history serialized as a string
        /// </summary>
        public string ChatHistory { get; set; }
        /// <summary>
        /// Returns true if the chat is a group or channel
        /// </summary>
        public bool IsGroup { get; set; }
        /// <summary>
        /// If channel, the team ID
        /// </summary>
        public string TeamId { get; set; }
        /// <summary>
        /// If channel, the channel ID
        /// </summary>
        public string ChannelId { get; set; }
    }
}
