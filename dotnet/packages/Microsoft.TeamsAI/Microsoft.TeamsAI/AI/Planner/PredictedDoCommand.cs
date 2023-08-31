﻿using System.Text.Json.Serialization;
using Microsoft.TeamsAI.Utilities.JsonConverters;

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
        [JsonPropertyName("action")]
        [JsonRequired]
        [JsonInclude]
        public string Action { get; private set; }

        /// <summary>
        /// Any entities that the AI system should use to perform the action.
        /// </summary>
        [JsonPropertyName("entities")]
        [JsonConverter(typeof(DictionaryJsonConverter))]
        public Dictionary<string, object>? Entities { get; set; }

        public PredictedDoCommand(string action, Dictionary<string, object> entities)
        {
            Action = action;
            Entities = entities;
        }

        [JsonConstructor]
        public PredictedDoCommand(string action)
        {
            Action = action;
            Entities = new Dictionary<string, object>();
        }
    }
}
