using DevOpsBot.Model;
using Microsoft.Teams.AI;

namespace DevOpsBot
{
    public class TeamsDevOpsBot : Application<DevOpsState>
    {
        public TeamsDevOpsBot(ApplicationOptions<DevOpsState> options) : base(options)
        {
            // Registering action handlers that will be hooked up to the planner.
            AI.ImportActions(new DevOpsActions());
        }
    }
}
