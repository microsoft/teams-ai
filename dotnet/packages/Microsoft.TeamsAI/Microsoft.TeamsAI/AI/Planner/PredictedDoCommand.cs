using System.Text.Json.Serialization;
using Microsoft.Teams.AI.Utilities.JsonConverters;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// A predicted DO command is an action that the AI system should perform.
    /// </summary>
    public class PredictedDoCommand : IPredictedCommand
    {
        /// <summary>
        /// Type to indicate that a DO command is being returned.
        /// </summary>
        public string Type { get; } = AIConstants.DoCommand;

        /// <summary>
        /// The named action that the AI system should perform.
        /// </summary>
        [JsonPropertyName("action")]
        [JsonRequired]
        [JsonInclude]
        public string Action { get; private set; }

        /// <summary>
        /// Any entities that the AI system should use to perform the action.
        /// </summary>
        [JsonPropertyName("entities")]
        [JsonConverter(typeof(DictionaryJsonConverter))]
        public Dictionary<string, object?>? Entities { get; set; }

        /// <summary>
        /// Creates a new instance of the <see cref="PredictedDoCommand"/> class.
        /// </summary>
        /// <param name="action">The action name.</param>
        /// <param name="entities">The entities to be passed on to action handler.</param>
        public PredictedDoCommand(string action, Dictionary<string, object?> entities)
        {
            Action = action;
            Entities = entities;
        }

        /// <summary>
        /// Creates a new instance of the <see cref="PredictedDoCommand"/> class.
        /// </summary>
        /// <param name="action"></param>
        [JsonConstructor]
        public PredictedDoCommand(string action)
        {
            Action = action;
            Entities = new Dictionary<string, object?>();
        }
    }
}
