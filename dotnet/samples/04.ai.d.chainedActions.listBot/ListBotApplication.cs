using ListBot.Model;
using Microsoft.Teams.AI;

namespace ListBot
{
    public class ListBotApplication : Application<ListState>
    {
        public ListBotApplication(ApplicationOptions<ListState> options) : base(options)
        {
            AI.ImportActions(new ListBotActions());
        }
    }
}
