using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
    public class PredictedDoCommand : IPredictedCommand
    {
        public string Type { get; } = AITypes.DoCommand;

        [JsonProperty("action")]
        [JsonRequired]
        public string Action { get; }

        [JsonProperty("entities")]
        public Dictionary<string, object>? Entities { get; }

        [JsonConstructor]
        public PredictedDoCommand(string action, Dictionary<string, object> entities)
        {
            Action = action;
            Entities = entities;
        }

        public PredictedDoCommand(string action)
        {
            Action = action;
            Entities = new Dictionary<string, object>();
        }
    }
}
