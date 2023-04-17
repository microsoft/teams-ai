using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class PredictedSayCommand : IPredictedCommand
    {
        public string Type { get; } = AITypes.SayCommand;

        [JsonProperty("response")]
        public string Response { get; set; }

        public PredictedSayCommand(string response)
        {
            Response = response;
        }
    }

}
