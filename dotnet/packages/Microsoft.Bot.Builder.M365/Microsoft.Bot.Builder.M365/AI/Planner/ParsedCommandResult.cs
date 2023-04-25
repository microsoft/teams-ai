using System;
using System.Collections.Generic;
using System.Text;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    public class ParsedCommandResult
    {
        public readonly int Length;
        public readonly PredictedCommand Command;

        public ParsedCommandResult(int length, PredictedCommand command)
        {
            Length = length;
            Command = command;
        }
    }
}
