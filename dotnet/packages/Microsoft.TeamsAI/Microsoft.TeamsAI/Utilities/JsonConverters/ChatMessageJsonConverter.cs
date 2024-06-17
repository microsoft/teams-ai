using Microsoft.Teams.AI.AI.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.Utilities.JsonConverters
{
    internal class ChatMessageJsonConverter : JsonConverter<ChatMessage>
    {
        public override ChatMessage Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options)
        {
            string? response = JsonSerializer.Deserialize<string>(ref reader);

            if (response == null)
            {
                throw new JsonException();
            }

            return new ChatMessage(ChatRole.Assistant)
            {
                Content = response
            };
        }

        public override void Write(Utf8JsonWriter writer, ChatMessage value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.GetContent<string>());
            writer.Flush();
        }
    }
}
