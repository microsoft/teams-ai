using DevOpsBot.Model;
using Microsoft.Teams.AI;
using Newtonsoft.Json;

namespace DevOpsBot
{
    public class TeamsDevOpsBot : Application<DevOpsState, DevOpsStateManager>
    {
        public TeamsDevOpsBot(ApplicationOptions<DevOpsState, DevOpsStateManager> options) : base(options)
        {
            // Adds function to be referenced in the prompt template
            AI.Prompts.AddFunction("getWorkItems", (turnContext, turnState) =>
            {
                EntityData[] workItems = turnState.Conversation!.WorkItems;
                string workItemsContent = JsonConvert.SerializeObject(workItems);
                return Task.FromResult(workItemsContent);
            });

            // Registering action handlers that will be hooked up to the planner.
            AI.ImportActions(new DevOpsActions(this));
        }
    }
}
