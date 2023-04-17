using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI
{
    public class Plan
    {
        [JsonProperty("commands")]
        public List<IPredictedCommand> Commands { get; }

        [JsonProperty("type")]
        [JsonRequired]
        public string Type { get; } = AITypes.Plan;

        public Plan()
        {
            Commands = new List<IPredictedCommand>();
        }

        public Plan(List<IPredictedCommand> commands)
        {
            Commands = commands;
        }
    }
}
