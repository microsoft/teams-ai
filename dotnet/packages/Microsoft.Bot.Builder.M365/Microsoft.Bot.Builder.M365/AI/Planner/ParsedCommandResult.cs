using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    internal class ParsedCommandResult
    {
        public int Length { get; set; }

        public IPredictedCommand Command { get; set; }

        public ParsedCommandResult(int length, IPredictedCommand command)
        {
            Length = length;
            Command = command;
        }
    }
}
