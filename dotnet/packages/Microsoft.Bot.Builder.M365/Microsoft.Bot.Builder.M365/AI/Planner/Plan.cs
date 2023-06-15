using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class Plan
    {
        /// <summary>
        /// A list of predicted commands that the AI system should execute.
        /// </summary>
        [JsonProperty("commands")]
        public List<IPredictedCommand> Commands { get; set; }

        /// <summary>
        /// Type to indicate that a plan is being returned.
        /// </summary>
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
