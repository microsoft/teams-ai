using Microsoft.Teams.AI.Utilities.JsonConverters;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// A plan is a list of commands that the AI system should execute.
    /// </summary>
    [JsonConverter(typeof(PlanJsonConverter))]
    public class Plan
    {
        private static readonly JsonSerializerOptions _serializerOptions = new()
        {
            WriteIndented = true
        };

        /// <summary>
        /// A list of predicted commands that the AI system should execute.
        /// </summary>
        [JsonPropertyName("commands")]
        public List<IPredictedCommand> Commands { get; set; }

        /// <summary>
        /// Type to indicate that a plan is being returned.
        /// </summary>
        [JsonPropertyName("type")]
        public string Type { get; } = AIConstants.Plan;

        /// <summary>
        /// Creates a new instance of the <see cref="Plan"/> class.
        /// </summary>
        public Plan()
        {
            Commands = new List<IPredictedCommand>();
        }

        /// <summary>
        /// Creates a new instance of the <see cref="Plan"/> class.
        /// </summary>
        /// <param name="commands">A list of model predicted commands.</param>
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
            return JsonSerializer.Serialize(this, typeof(Plan), _serializerOptions);
        }

    }
}
