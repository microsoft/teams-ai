using Microsoft.Teams.AI.AI.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.Utilities.JsonConverters
{
    internal class ChatMessageContentJsonConverter : JsonConverter<object>
    {
        public override object Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options)
        {
            string? stringResponse = JsonSerializer.Deserialize<string>(ref reader);
            if (stringResponse == null)
            {
                // TODO: Implement desierlizing non-string content.
                stringResponse = "";
            }

            return stringResponse;
        }

        public override void Write(Utf8JsonWriter writer, object content, JsonSerializerOptions options)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("content");
            
            if (content == null)
            {
                writer.WriteNullValue();
            }
            else if (content is string stringContent)
            {
                writer.WriteStringValue(stringContent);
            }
            else
            {
                // TODO: Implement deserializing non-string content.
                writer.WriteStringValue("");
            }

            writer.WriteEndObject();
            writer.Flush();
        }
    }
}
