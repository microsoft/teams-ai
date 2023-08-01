using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.TeamsAI.AI.Planner
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
