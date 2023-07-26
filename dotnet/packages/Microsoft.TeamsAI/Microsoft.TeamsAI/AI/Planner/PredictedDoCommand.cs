using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.TeamsAI.AI.Planner
{
    /// <summary>
    /// A predicted DO command is an action that the AI system should perform.
    /// </summary>
    public class PredictedDoCommand : IPredictedCommand
    {
        /// <summary>
        /// Type to indicate that a DO command is being returned.
        /// </summary>
        public string Type { get; } = AITypes.DoCommand;

        /// <summary>
        /// The named action that the AI system should perform.
        /// </summary>
        [JsonProperty("action")]
        [JsonRequired]
        public string Action { get; }

        /// <summary>
        /// Any entities that the AI system should use to perform the action.
        /// </summary>
        [JsonProperty("entities")]
        public Dictionary<string, object> Entities { get; }

        [JsonConstructor]
        public PredictedDoCommand(string action, Dictionary<string, object> entities)
        {
            Action = action;
            Entities = entities ?? new Dictionary<string, object>();
        }

        public PredictedDoCommand(string action)
        {
            Action = action;
            Entities = new Dictionary<string, object>();
        }
    }
}
