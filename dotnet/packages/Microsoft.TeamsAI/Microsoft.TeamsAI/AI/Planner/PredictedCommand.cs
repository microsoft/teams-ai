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
