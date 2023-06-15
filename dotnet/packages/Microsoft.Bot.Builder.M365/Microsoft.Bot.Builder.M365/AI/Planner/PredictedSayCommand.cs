using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    /// <summary>
    /// A predicted SAY command is a response that the AI system should say.
    /// </summary>
    public class PredictedSayCommand : IPredictedCommand
    {
        /// <summary>
        /// The type to indicate that a SAY command is being returned.
        /// </summary>
        public string Type { get; } = AITypes.SayCommand;

        /// <summary>
        /// The response that the AI system should say.
        /// </summary>
        [JsonProperty("response")]
        public string Response { get; set; }

        public PredictedSayCommand(string response)
        {
            Response = response;
        }
    }

}
