using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class PredictedDoCommand : PredictedCommand
    {
        [JsonProperty("action")]
        [JsonRequired]
        public string Action { get; }

        [JsonProperty("entities")]
        public Dictionary<string, object>? Entities { get; }

        [JsonConstructor]
        public PredictedDoCommand(string action, Dictionary<string, object> entities) : base(AITypes.DoCommand)
        {
            Action = action;
            Entities = entities;
        }

        public PredictedDoCommand(string action) : this(action, new Dictionary<string, object>())
        {

        }
    }
}
