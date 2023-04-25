using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class ParsedCommandResult
    {
        public int Length { get; set; }
        public PredictedCommand Command { get; set; }

        public ParsedCommandResult(int length, PredictedCommand command)
        {
            Length = length;
            Command = command;
        }
    }
}
