using Microsoft.TeamsAI.Utilities.JsonConverters;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.TeamsAI.AI.Planner
{
    /// <summary>
    /// A plan is a list of commands that the AI system should execute.
    /// </summary>
    [JsonConverter(typeof(PlanJsonConverter))]
    public class Plan
    {
        /// <summary>
        /// A list of predicted commands that the AI system should execute.
        /// </summary>
        [JsonPropertyName("commands")]
        [JsonIgnore]
        public List<IPredictedCommand> Commands { get; set; }

        /// <summary>
        /// Type to indicate that a plan is being returned.
        /// </summary>
        [JsonPropertyName("type")]
        [JsonIgnore]
        public string Type { get; } = AITypes.Plan;

        public Plan()
        {
            Commands = new List<IPredictedCommand>();
        }

        [JsonConstructor]
        public Plan(List<IPredictedCommand> commands)
        {
            Commands = commands;
        }

        /// <summary>
        /// Returns a Json string representation of the plan.
        /// </summary>
        public string ToJsonString()
        {
            return JsonSerializer.Serialize(this, typeof(Plan), new JsonSerializerOptions()
            {
                WriteIndented = true
            });
        }

    }
}
