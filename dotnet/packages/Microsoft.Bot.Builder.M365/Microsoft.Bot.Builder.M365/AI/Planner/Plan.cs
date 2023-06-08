using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class Plan
    {
        [JsonProperty("commands")]
        public List<PredictedCommand> Commands { get; }

        [JsonProperty("type")]
        [JsonRequired]
        public string Type { get; } = AITypes.Plan;

        public Plan()
        {
            Commands = new List<PredictedCommand>();
        }

        public Plan(List<PredictedCommand> commands)
        {
            Commands = commands;
        }
    }
}
