using ListBot.Model;
using Microsoft.Teams.AI;
using System.Text.Json;

namespace ListBot
{
    public class ListBotApplication : Application<ListState, ListStateManager>
    {
        public ListBotApplication(ApplicationOptions<ListState, ListStateManager> options) : base(options)
        {
            AI.Prompts.AddFunction("getListNames", (turnContext, turnState) =>
            {
                string listNames = JsonSerializer.Serialize(turnState.Conversation!.ListNames);
                return Task.FromResult(listNames);
            });

            AI.Prompts.AddFunction("getLists", (turnContext, turnState) =>
            {
                string lists = JsonSerializer.Serialize(turnState.Conversation!.Lists);
                return Task.FromResult(lists);
            });

            AI.ImportActions(new ListBotActions(this));
        }
    }
}
