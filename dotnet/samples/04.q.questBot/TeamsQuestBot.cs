using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using QuestBot.Actions;
using QuestBot.State;

namespace QuestBot
{
    public class TeamsQuestBot : Application<QuestState, QuestStateManager>
    {
        public TeamsQuestBot(ApplicationOptions<QuestState, QuestStateManager> options) : base(options)
        {
            AI.ImportActions(new QuestBotActions(this));

            // Register prompt functions
            AI.Prompts.AddFunction("describeGameState", DescribeGameState);
            AI.Prompts.AddFunction("describeCampaign", DescribeCampaign);
            AI.Prompts.AddFunction("describeQuests", DescribeQuests);
            AI.Prompts.AddFunction("describePlayerInfo", DescribePlayerInfo);
            AI.Prompts.AddFunction("describeLocation", DescribeLocation);
            AI.Prompts.AddFunction("describeConditions", DescribeConditions);
        }

        private Task<string> DescribeGameState(ITurnContext context, QuestState state)
        {
            var conversation = state.Conversation!;
            return Task.FromResult($"\tTotalTurns: {conversation.Turn - 1}\n\tLocationTurns: {conversation.LocationTurn - 1}");
        }

        private Task<string> DescribeCampaign(ITurnContext _, QuestState state)
        {
            var conversation = state.Conversation!;
            return Task.FromResult(conversation.Campaign == null ?
                string.Empty :
                $"\"{conversation.Campaign.Title}\" - {conversation.Campaign.PlayerIntro}");
        }

        private Task<string> DescribeQuests(ITurnContext _, QuestState state)
        {
            var conversation = state.Conversation!;
            return Task.FromResult(conversation.Quests == null ?
                "none" :
                string.Join("\n\n", conversation.Quests.Values.Select(q => $"\"{q.Title}\" - {q.Description}")));
        }

        private Task<string> DescribePlayerInfo(ITurnContext _, QuestState state)
        {
            var player = state.User!;
            var p = $"\tName: {player.Name}\n\tBackstory: {player.Backstory}\n\tEquipped: {player.Equipped}\n\tInventory:\n";
            var i = player.Inventory == null ?
                string.Empty :
                string.Join("\n", player.Inventory.Select(kv => $"\t\t{kv.Key}: {kv.Value}"));
            return Task.FromResult(p + i);
        }

        private Task<string> DescribeLocation(ITurnContext _, QuestState state)
        {
            var conversation = state.Conversation!;
            return Task.FromResult(conversation.Location == null ?
                string.Empty :
                $"\"{conversation.Location.Title}\" - {conversation.Location.Description}");
        }

        private Task<string> DescribeConditions(ITurnContext _, QuestState state)
        {
            var conversation = state.Conversation!;
            return Task.FromResult(Conditions.DescribeConditions(conversation.Time, conversation.Day, conversation.Temperature ?? string.Empty, conversation.Weather ?? string.Empty));
        }
    }
}
