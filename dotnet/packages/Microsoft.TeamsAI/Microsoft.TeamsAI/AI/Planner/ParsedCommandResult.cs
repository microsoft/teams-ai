namespace Microsoft.TeamsAI.AI.Planner
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
