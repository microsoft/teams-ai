using Microsoft.TeamsAI;
using QuestBot.State;

namespace QuestBot
{
    public class TeamsQuestBot : Application<QuestState, QuestStateManager>
    {
        public TeamsQuestBot(ApplicationOptions<QuestState, QuestStateManager> options) : base(options)
        {
        }
    }
}
