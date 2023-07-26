using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Microsoft.TeamsAI.AI.Planner
{
    public class PlanJsonConverter : JsonConverter
    {
        public override bool CanConvert(Type objectType)
        {
            return typeof(Plan) == objectType;
        }

        public override bool CanWrite => false;

        public override object? ReadJson(JsonReader reader, Type objectType, object? existingValue, JsonSerializer serializer)
        {
            JObject item = JObject.Load(reader);

            if (item.TryGetValue("type", StringComparison.InvariantCultureIgnoreCase, out JToken? planType))
            {
                if (planType?.Type == JTokenType.String)
                {
                    string? planTypeString = planType.Value<string>();
                    if (string.Equals(AITypes.Plan, planTypeString, StringComparison.InvariantCultureIgnoreCase))
                    {
                        return item.ToObject<Plan>(serializer);
                    }
                }
            }

            // For any JSON not a Plan, return null to be parsed as default command
            return null;
        }

        public override void WriteJson(JsonWriter writer, object? value, JsonSerializer serializer)
        {
            throw new NotSupportedException();
        }
    }
}
