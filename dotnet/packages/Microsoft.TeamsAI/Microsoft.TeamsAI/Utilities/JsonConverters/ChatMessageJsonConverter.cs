using Microsoft.Teams.AI.AI.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.Utilities.JsonConverters
{
    internal class ChatMessageJsonConverter : JsonConverter<ChatMessage>
    {
        private static JsonSerializerOptions serializerOptions = new();

        public override ChatMessage Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.StartObject)
            {
                throw new JsonException();
            }

            var chatMessage = new ChatMessage(ChatRole.Assistant);

            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    return chatMessage;
                }

                if (reader.TokenType == JsonTokenType.PropertyName)
                {
                    string? propertyName = reader.GetString();

                    reader.Read();

                    switch (propertyName)
                    {
                        case "role":
                            string role = reader.GetString() ?? "";
                            chatMessage.Role = new ChatRole(role);
                            break;
                        case "content":
                            string content = reader.GetString() ?? "";
                            chatMessage.Content = JsonSerializer.Deserialize<string>(content, serializerOptions);
                            break;
                        case "name":
                            chatMessage.Name = reader.GetString();
                            break;
                        case "actionCallId":
                            chatMessage.ActionCallId = reader.GetString();
                            break;
                        case "context":
                            // TODO: Implement deserializing message context.
                            break;
                        case "attachments":
                            // TODO: Implement deserializing attachments.
                            break;
                        case "actionCalls":
                            chatMessage.ActionCalls = JsonSerializer.Deserialize<List<ActionCall>>(ref reader, options);
                            break;
                        default:
                            reader.Skip();
                            break;
                    }
                }
            }

            throw new JsonException("Invalid JSON format for ChatMessage.");
        }

        public override void Write(Utf8JsonWriter writer, ChatMessage chatMessage, JsonSerializerOptions options)
        {
            writer.WriteStartObject();

            writer.WritePropertyName("role");
            writer.WriteStringValue(chatMessage.Role.ToString());

            if (chatMessage.Content != null && chatMessage.Content is string)
            {
                writer.WritePropertyName("content");
                writer.WriteStringValue(chatMessage.GetContent<string>());
            }

            if (chatMessage.Name != null)
            {
                writer.WritePropertyName("name");
                writer.WriteStringValue(chatMessage.Name);
            }

            if (chatMessage.ActionCallId != null)
            {
                writer.WritePropertyName("actionCallId");
                writer.WriteStringValue(chatMessage.ActionCallId);
            }

            if (chatMessage.Context != null)
            {
                writer.WritePropertyName("context");
                writer.WriteRawValue(JsonSerializer.Serialize(chatMessage.Context));
            }

            if (chatMessage.ActionCalls != null)
            {
                writer.WritePropertyName("actionCalls");
                writer.WriteRawValue(JsonSerializer.Serialize(chatMessage.ActionCalls));
            }

            writer.WriteEndObject();
            writer.Flush();
        }
    }
}
