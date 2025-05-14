using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Linq;
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

        /// <summary>
        /// Sets the Feedback Loop in Teams that allows a user to
        /// give thumbs up or down to a response. Should not be set if setting feedbackLoopType.
        /// </summary>
        [JsonProperty(PropertyName = "feedbackLoopEnabled")]
        public bool? feedbackLoopEnabled { get; set; }

        /// <summary>
        /// Represents the type of feedback loop. It can be set to one of "default" or "custom".
        /// </summary>
        [JsonConverter(typeof(FeedbackLoopTypeConverter))]
        [JsonProperty(PropertyName = "feedbackLoop")]
        public string? feedbackLoopType { get; set; }

        /// <summary>
        /// Converts feedbackLoopType string to/from the type property of a feedbackLoop object expected within a channelData JSON object.
        /// </summary>
        private class FeedbackLoopTypeConverter : JsonConverter<string?>
        {
            public override void WriteJson(JsonWriter writer, string? value, JsonSerializer serializer)
            {
                if (value is not null)
                {
                    JObject obj = new JObject { { "type", value } };
                    obj.WriteTo(writer);
                }
                else
                {
                    writer.WriteNull(); // Ensure null values are handled properly  
                }
            }

            public override string? ReadJson(JsonReader reader, Type objectType, string? existingValue, bool hasExistingValue, JsonSerializer serializer)
            {
                if (reader.TokenType == JsonToken.Null)
                    return null;

                JObject obj = JObject.Load(reader);
                JToken? token = obj?["type"];
                return token?.ToString();
            }
        }
    }
}




