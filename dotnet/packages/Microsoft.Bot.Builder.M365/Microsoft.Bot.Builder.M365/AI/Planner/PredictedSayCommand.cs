using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class PredictedSayCommand : PredictedCommand
    {
        [JsonProperty("response")]
        [JsonRequired]
        public string Response { get; set; }

        public PredictedSayCommand(string response) : base(AITypes.SayCommand)
        {
            Response = response;
        }
    }

}
