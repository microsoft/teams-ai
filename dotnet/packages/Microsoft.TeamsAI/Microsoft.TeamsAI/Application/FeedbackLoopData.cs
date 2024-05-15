using Newtonsoft.Json;

namespace Microsoft.Teams.AI.Application
{
    /// <summary>
    /// Data returned when the thumbsup or thumbsdown button is clicked and response is received.
    /// </summary>
    public class FeedbackLoopData
    {
        /// <summary>
        /// The action name.
        /// </summary>
        public string ActionName { get; set; } = "feedback";

        /// <summary>
        /// The action value.
        /// </summary>
        [JsonProperty(PropertyName = "actionValue")]
        public FeedbackLoopDataActionValue? ActionValue { get; set; }

        /// <summary>
        /// The activity ID that the feedback provided on.
        /// </summary>
        [JsonProperty(PropertyName = "replyToId")]
        public string? ReplyToId { get; set; }
    }

    /// <summary>
    /// The feedback loop data's action value.
    /// </summary>
    public class FeedbackLoopDataActionValue
    {
        /// <summary>
        /// Either "like" or "dislike"
        /// </summary>
        [JsonProperty(PropertyName = "reaction")]
        public string? Reaction { get; set; }

        /// <summary>
        /// The feedback provided by the user when prompted with "What did you lke/dislike?"
        /// </summary>
        [JsonProperty(PropertyName = "feedback")]
        public string? Feedback { get; set; }
    }
}
