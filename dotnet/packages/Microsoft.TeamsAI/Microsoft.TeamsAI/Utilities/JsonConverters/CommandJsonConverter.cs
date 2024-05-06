using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planners;

namespace Microsoft.Teams.AI.Utilities.JsonConverters
{
    internal class PredictedCommandJsonConverter : JsonConverter<IPredictedCommand>
    {
        private static JsonEncodedText _typePropertyName = JsonEncodedText.Encode("type");
        private static JsonEncodedText _actionPropertyName = JsonEncodedText.Encode("action");
        private static JsonEncodedText _parametersPropertyName = JsonEncodedText.Encode("parameters");
        private static JsonEncodedText _responsePropertyName = JsonEncodedText.Encode("response");

        public override bool CanConvert(Type typeToConvert)
        {
            return typeof(IPredictedCommand).IsAssignableFrom(typeToConvert);
        }


        public override IPredictedCommand Read(ref Utf8JsonReader reader, Type objectType, JsonSerializerOptions options)
        {
            Utf8JsonReader readerClone = reader;

            if (readerClone.TokenType != JsonTokenType.StartObject)
            {
                throw new JsonException();
            };

            readerClone.Read();
            if (readerClone.TokenType != JsonTokenType.PropertyName)
            {
                throw new JsonException();
            }

            string? propertyName = readerClone.GetString();
            if (propertyName != "type")
            {
                throw new JsonException("The missing `type` property should be the first property in the Json object.");
            }

            readerClone.Read();
            if (readerClone.TokenType != JsonTokenType.String)
            {
                throw new JsonException("Invalid value for the `type` property. String expected.");
            }

            string? commandType = readerClone.GetString();

            IPredictedCommand predictedCommand = (commandType?.ToUpperInvariant()) switch
            {
                AIConstants.DoCommand => JsonSerializer.Deserialize<PredictedDoCommand>(ref reader)!,
                AIConstants.SayCommand => JsonSerializer.Deserialize<PredictedSayCommand>(ref reader)!,
                _ => throw new JsonException($"Unknown command type `{commandType}`")
            };

            return predictedCommand;
        }

        public override void Write(Utf8JsonWriter writer, IPredictedCommand value, JsonSerializerOptions options)
        {
            writer.WriteStartObject();

            writer.WritePropertyName(_typePropertyName);

            Type command = value.GetType();

            if (command == typeof(PredictedDoCommand))
            {
                writer.WriteStringValue(AIConstants.DoCommand);

                writer.WritePropertyName(_actionPropertyName);

                JsonSerializer.Serialize(writer, ((PredictedDoCommand)value).Action, options);

                writer.WritePropertyName(_parametersPropertyName);

                JsonSerializer.Serialize(writer, ((PredictedDoCommand)value).Parameters, options);
            }
            else if (command == typeof(PredictedSayCommand))
            {
                writer.WriteStringValue(AIConstants.SayCommand);

                writer.WritePropertyName(_responsePropertyName);

                JsonSerializer.Serialize(writer, ((PredictedSayCommand)value).Response.Content, options);
            }
            else
            {
                throw new JsonException($"Unknown command type `{command}`");
            }

            writer.WriteEndObject();

        }
    }
}
