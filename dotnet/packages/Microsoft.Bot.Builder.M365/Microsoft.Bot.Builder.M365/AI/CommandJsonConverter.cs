using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
    public class PredictedCommandJsonConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return typeof(IPredictedCommand) == objectType;
        }

        public override bool CanWrite => false;

       public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
        {
            JObject item = JObject.Load(reader);

            if (item.TryGetValue("type", StringComparison.InvariantCultureIgnoreCase, out JToken commandType))
            {
                if (commandType.Type != JTokenType.String)
                {
                    throw new JsonSerializationException("Invalid command type format");
                }

                switch (commandType.Value<string>()?.ToUpperInvariant())
                {
                    case AITypes.DoCommand:
                        return item.ToObject<PredictedDoCommand>(serializer);
                    case AITypes.SayCommand:
                        return item.ToObject<PredictedSayCommand>(serializer);
                    default:
                        throw new JsonSerializationException($"Unknown command type `{commandType}`");
                }
            }

            throw new JsonSerializationException("Command object missing `type`");
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
