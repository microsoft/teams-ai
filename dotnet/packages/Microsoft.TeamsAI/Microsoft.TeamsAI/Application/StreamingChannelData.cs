using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;

namespace Microsoft.Teams.AI.Application
{
    /// <summary>
    /// Structure of the outgoing channelData field for streaming responses.
    /// 
    /// The expected sequence of streamTypes is:
    /// `informative`, `streaming`, `streaming`, ..., `final`.
    /// 
    /// Once a `final` message is sent, the stream is considered ended.
    /// </summary>
    public class StreamingChannelData
    {
        /// <summary>
        /// The type of message being sent.
        /// </summary>
        [JsonConverter(typeof(StringEnumConverter), typeof(CamelCaseNamingStrategy))]
        [JsonProperty(PropertyName = "streamType")]
        public StreamType StreamType { get; set; }

        /// <summary>
        /// Sequence number of the message in the stream.
        /// Starts at 1 for the first message and increments from there.
        /// </summary>
        [JsonProperty(PropertyName = "streamSequence")]
        public int? StreamSequence { get; set; } = 1;

        /// <summary>
        ///  ID of the stream.
        ///  Assigned after the initial update is sent.
        /// </summary>
        [JsonProperty(PropertyName = "streamId")]
        public string? streamId { get; set; }
    }
}
