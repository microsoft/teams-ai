using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public abstract class PredictedCommand
    {
        public string Type { get; }

        public PredictedCommand(string type)
        {
            Type = type;
        }
    }
}
