using ListBot.Model;
using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Action;
using Microsoft.TeamsAI.AI;

namespace ListBot
{
    public class ListBotActions
    {
        private readonly Application<ListState, ListStateManager> _application;

        public ListBotActions(Application<ListState, ListStateManager> application)
        {
            _application = application;
        }

        [Action("CreateList")]
        public bool CreateList([ActionTurnState] ListState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(entities);

            string listName = GetEntityString(entities, "list");

            EnsureListExists(turnState, listName);

            return true;
        }

        [Action("DeleteList")]
        public bool DeleteList([ActionTurnState] ListState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(entities);

            string listName = GetEntityString(entities, "list");

            DeleteList(turnState, listName);

            return true;
        }

        [Action("AddItem")]
        public bool AddItem([ActionTurnState] ListState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(entities);

            string listName = GetEntityString(entities, "list");
            string item = GetEntityString(entities, "item");

            IList<string> items = GetItems(turnState, listName);
            items.Add(item);
            SetItems(turnState, listName, items);

            return true;
        }

        [Action("RemoveItem")]
        public async Task<bool> RemoveItem([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] ListState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(entities);

            string listName = GetEntityString(entities, "list");
            string item = GetEntityString(entities, "item");

            IList<string> items = GetItems(turnState, listName);
            if (!items.Contains(listName))
            {
                await turnContext.SendActivityAsync(ResponseBuilder.ItemNotFound(listName, item)).ConfigureAwait(false);

                // End the current chain
                return false;
            }
            else
            {
                items.Remove(item);
                SetItems(turnState, listName, items);

                return true;
            }
        }

        [Action("FindItem")]
        public async Task<bool> FindItem([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] ListState turnState, [ActionEntities] Dictionary<string, object> entities)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);
            ArgumentNullException.ThrowIfNull(entities);

            string listName = GetEntityString(entities, "list");
            string item = GetEntityString(entities, "item");

            IList<string> items = GetItems(turnState, listName);
            await turnContext.SendActivityAsync(items.Contains(item) ?
                ResponseBuilder.ItemFound(listName, item) :
                ResponseBuilder.ItemNotFound(listName, item)).ConfigureAwait(false);

            // End the current chain
            return false;
        }

        [Action("SummarizeLists")]
        public async Task<bool> SummarizeLists([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] ListState turnState)
        {
            ArgumentNullException.ThrowIfNull(turnContext);
            ArgumentNullException.ThrowIfNull(turnState);

            Dictionary<string, IList<string>>? lists = turnState.Conversation!.Lists;
            if (lists is not null)
            {
                await _application.AI.ChainAsync(turnContext, turnState, "Summarize").ConfigureAwait(false);
            }
            else
            {
                await turnContext.SendActivityAsync(ResponseBuilder.NoListsFound()).ConfigureAwait(false);
            }

            // End the current chain
            return false;
        }

        [Action(AIConstants.UnknownActionName)]
        public async Task<bool> UnknownAction([ActionTurnContext] ITurnContext turnContext, [ActionName] string action)
        {
            ArgumentNullException.ThrowIfNull(turnContext);

            await turnContext.SendActivityAsync(ResponseBuilder.UnknownAction(action)).ConfigureAwait(false);

            return false;
        }

        private static IList<string> GetItems(ListState turnState, string listName)
        {
            EnsureListExists(turnState, listName);

            return turnState.Conversation!.Lists![listName];
        }

        private static void SetItems(ListState turnState, string listName, IList<string> items)
        {
            EnsureListExists(turnState, listName);

            turnState.Conversation!.Lists![listName] = items;
        }

        private static void EnsureListExists(ListState turnState, string listName)
        {
            if (turnState.Conversation!.Lists is null)
            {
                turnState.Conversation.Lists = new Dictionary<string, IList<string>>();
                turnState.Conversation.ListNames = new List<string>();
            }

            if (!turnState.Conversation.Lists.ContainsKey(listName))
            {
                turnState.Conversation.Lists[listName] = new List<string>();
                turnState.Conversation.ListNames!.Add(listName);
            }
        }

        private static void DeleteList(ListState turnState, string listName)
        {
            if (turnState.Conversation!.Lists?.Remove(listName) == true)
            {
                turnState.Conversation.ListNames!.Remove(listName);
            }
        }

        private static string GetEntityString(Dictionary<string, object> entities, string key)
        {
            if (!entities.TryGetValue(key, out object? value))
            {
                throw new ArgumentException($"No {key} in entities.", nameof(entities));
            }

            if (value is not string castValue)
            {
                throw new ArgumentException($"{key} is not of type string.", nameof(entities));
            }

            return castValue;
        }
    }
}
