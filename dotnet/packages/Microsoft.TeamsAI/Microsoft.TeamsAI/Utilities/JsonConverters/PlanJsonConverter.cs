using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Teams.AI.AI;
using Microsoft.Teams.AI.AI.Planner;

namespace Microsoft.Teams.AI.Utilities.JsonConverters
{
    internal class PlanJsonConverter : JsonConverter<Plan>
    {
        private static JsonEncodedText _typePropertyName = JsonEncodedText.Encode("type");
        private static JsonEncodedText _commandsPropertyName = JsonEncodedText.Encode("commands");

        public override bool CanConvert(Type objectType)
        {
            return typeof(Plan).IsAssignableFrom(objectType);
        }

        public override Plan? Read(ref Utf8JsonReader reader, Type objectType, JsonSerializerOptions options)
        {

            if (reader.TokenType != JsonTokenType.StartObject)
            {
                return null;
            };

            List<IPredictedCommand> commands = new();
            bool typeIsPlan = false;

            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndObject)
                {
                    break;
                }
                else if (reader.TokenType == JsonTokenType.PropertyName)
                {
                    string? name = reader.GetString();

                    if (name == "type")
                    {
                        reader.Read();
                        if (reader.TokenType != JsonTokenType.String)
                        {
                            throw new JsonException("Invalid value for the `type` property. String expected.");
                        }

                        string? type = reader.GetString();

                        if (type == null || !type.Equals(AIConstants.Plan, StringComparison.OrdinalIgnoreCase))
                        {
                            throw new JsonException("The `type` property has to be equal to \"plan\" for it to be a plan json object");
                        }

                        typeIsPlan = true;
                    }
                    else if (name == "commands")
                    {
                        reader.Read();

                        if (reader.TokenType != JsonTokenType.StartArray)
                        {
                            // the `commands` property should be an array
                            throw new JsonException("The `commands` property should be an array");
                        };

                        while (reader.Read())
                        {
                            if (reader.TokenType == JsonTokenType.EndArray)
                            {
                                break;
                            }
                            else if (reader.TokenType == JsonTokenType.StartObject)
                            {
                                IPredictedCommand? command = JsonSerializer.Deserialize<IPredictedCommand>(ref reader, options);
                                if (command != null)
                                {
                                    commands.Add(command);
                                }
                            }
                        }
                    }
                }
            };

            if (!typeIsPlan)
            {
                return null;
            }

            return new Plan(commands);
        }



        public override void Write(Utf8JsonWriter writer, Plan value, JsonSerializerOptions options)
        {
            writer.WriteStartObject();

            writer.WritePropertyName(_typePropertyName);

            writer.WriteStringValue(AIConstants.Plan);

            writer.WritePropertyName(_commandsPropertyName);

            writer.WriteStartArray();

            foreach (IPredictedCommand command in value.Commands)
            {
                JsonSerializer.Serialize(writer, command, options);
            }

            writer.WriteEndArray();

            writer.WriteEndObject();

            writer.Flush();
        }
    }
}
