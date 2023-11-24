using ListBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.Teams.AI.AI.Action;
using Microsoft.Teams.AI.AI;

namespace ListBot
{
    public class ListBotActions
    {
        public ListBotActions()
        {
        }

        [Action("CreateList")]
        public string CreateList([ActionTurnState] ListState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(parameters);

            string listName = GetParameterString(parameters, "list");

            EnsureListExists(turnState, listName);

            return "list created. think about your next action";
        }

        [Action("DeleteList")]
        public string DeleteList([ActionTurnState] ListState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(parameters);

            string listName = GetParameterString(parameters, "list");

            DeleteList(turnState, listName);

            return "list deleted. think about your next action";
        }

        [Action("AddItem")]
        public string AddItem([ActionTurnState] ListState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(parameters);

            string listName = GetParameterString(parameters, "list");
            string item = GetParameterString(parameters, "item");

            IList<string> items = GetItems(turnState, listName);
            items.Add(item);
            SetItems(turnState, listName, items);

            return "item added. think about your next action";
        }

        [Action("RemoveItem")]
        public async Task<string> RemoveItem([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] ListState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(parameters);

            string listName = GetParameterString(parameters, "list");
            string item = GetParameterString(parameters, "item");

            IList<string> items = GetItems(turnState, listName);

            if (!items.Contains(item))
            {
                await turnContext.SendActivityAsync(ResponseBuilder.ItemNotFound(listName, item)).ConfigureAwait(false);
                return "item not found. think about your next action";
            }

            items.Remove(item);
            SetItems(turnState, listName, items);
            return "item removed. think about your next action";
        }

        [Action(AIConstants.UnknownActionName)]
        public async Task<string> UnknownAction([ActionTurnContext] ITurnContext turnContext, [ActionName] string action)
        {
            ArgumentNullException.ThrowIfNull(turnContext);

            await turnContext.SendActivityAsync(ResponseBuilder.UnknownAction(action)).ConfigureAwait(false);

            return $"unknown action: {action}";
        }

        private static IList<string> GetItems(ListState turnState, string listName)
        {
            if (turnState.Conversation.Lists.ContainsKey(listName))
            {
                return turnState.Conversation.Lists[listName];
            }

            return new List<string>();
        }

        private static void SetItems(ListState turnState, string listName, IList<string> items)
        {
            var lists = turnState.Conversation.Lists;
            lists[listName] = items;
            turnState.Conversation.Lists = lists;
        }

        private static void EnsureListExists(ListState turnState, string listName)
        {
            var lists = turnState.Conversation.Lists;

            if (!lists.ContainsKey(listName))
            {
                lists[listName] = new List<string>();
                turnState.Conversation.Lists = lists;
            }
        }

        private static void DeleteList(ListState turnState, string listName)
        {
            var lists = turnState.Conversation.Lists;

            if (lists.ContainsKey(listName))
            {
                lists.Remove(listName);
                turnState.Conversation.Lists = lists;
            }
        }

        private static string GetParameterString(Dictionary<string, object> parameters, string key)
        {
            if (!parameters.TryGetValue(key, out object? value))
            {
                throw new ArgumentException($"No {key} in parameters.", nameof(parameters));
            }

            if (value is not string castValue)
            {
                throw new ArgumentException($"{key} is not of type string.", nameof(parameters));
            }

            return castValue;
        }
    }
}
