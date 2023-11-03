using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.Utilities.JsonConverters
{
    internal class DictionaryJsonConverter : JsonConverter<Dictionary<string, object>>
    {
        public override bool CanConvert(Type typeToConvert)
        {
            return typeof(Dictionary<string, object>).IsAssignableFrom(typeToConvert);
        }

        public override Dictionary<string, object> Read(
        ref Utf8JsonReader reader,
        Type typeToConvert,
        JsonSerializerOptions options)
        {
            if (reader.TokenType != JsonTokenType.StartObject)
            {
                throw new JsonException();
            }

            Dictionary<string, object> dictionary = new();

            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    return dictionary;
                }

                // Get the key.
                if (reader.TokenType != JsonTokenType.PropertyName)
                {
                    throw new JsonException();
                }

                string? key = reader.GetString();

                if (key == null)
                {
                    throw new JsonException();
                }

                // Get the value.
                reader.Read();

                object value = reader.TokenType switch
                {
                    JsonTokenType.True => true,
                    JsonTokenType.False => false,
                    JsonTokenType.Number when reader.TryGetInt64(out long l) => l,
                    JsonTokenType.Number => reader.GetDouble(),
                    JsonTokenType.String when reader.TryGetDateTime(out DateTime datetime) => datetime,
                    JsonTokenType.String => reader.GetString()!,
                    _ => JsonDocument.ParseValue(ref reader).RootElement.Clone()
                };

                // Add to dictionary.
                dictionary.Add(key, value);
            }

            throw new JsonException();
        }

        public override void Write(Utf8JsonWriter writer, Dictionary<string, object> dictionary, JsonSerializerOptions options)
        {
            writer.WriteStartObject();

            foreach (KeyValuePair<string, object> item in dictionary)
            {
                string key = item.Key;
                object value = item.Value;

                string propertyName = key.ToString();
                writer.WritePropertyName(options.PropertyNamingPolicy?.ConvertName(propertyName) ?? propertyName);

                JsonSerializer.Serialize(writer, value, options);
            }

            writer.WriteEndObject();
        }
    }
}
