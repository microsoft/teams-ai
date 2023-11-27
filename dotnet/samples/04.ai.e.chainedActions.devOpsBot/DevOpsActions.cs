using DevOpsBot.Model;
using Microsoft.Teams.AI.AI.Action;
using System.Text.Json;

namespace DevOpsBot
{
    public class DevOpsActions
    {
        [Action("UpdateMembers")]
        public string UpdateMembers([ActionTurnState] DevOpsState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnState);

            UserUpdate userUpdate = GetUserUpdate(parameters);
            if (userUpdate.Added!.Length > 0 || userUpdate.Removed!.Length > 0)
            {
                foreach (string item in userUpdate.Removed!)
                {
                    int index = Array.IndexOf(turnState.Conversation.Members, item);
                    if (index > -1)
                    {
                        turnState.Conversation.Members = RemoveAt(turnState.Conversation.Members, index);
                    }
                }
                foreach (string item in userUpdate.Added)
                {
                    if (!turnState.Conversation.Members.Contains(item))
                    {
                        turnState.Conversation.Members = turnState.Conversation.Members.Append(item).ToArray();
                    }
                }
                return "members updated. think about your next action";
            }

            return "no member changes made. think about your next action";
        }

        [Action("CreateWI")]
        public string CreateWI([ActionTurnState] DevOpsState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnState);

            WorkItem workItem = GetWorkItem(parameters);
            turnState.Conversation.NextId = turnState.Conversation.NextId + 1;
            workItem.Id = turnState.Conversation.NextId;
            workItem.Status = "proposed";
            turnState.Conversation.WorkItems = turnState.Conversation.WorkItems.Append(workItem).ToArray();

            if (string.IsNullOrEmpty(workItem.AssignedTo))
            {
                return $"work item created with id {workItem.Id}. think about your next action";
            }
            else
            {
                return $"work item created with id {workItem.Id} but needs to be assigned. think about your next action";
            }
        }

        [Action("UpdateWI")]
        public string UpdateWI([ActionTurnState] DevOpsState turnState, [ActionParameters] Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(turnState);

            WorkItem workItem = GetWorkItem(parameters);
            WorkItem[] workItems = turnState.Conversation.WorkItems;
            WorkItem? target = workItems.FirstOrDefault(item => item.Id == workItem.Id);
            if (target != null)
            {
                target.Title = workItem.Title ?? target.Title;
                target.AssignedTo = workItem.AssignedTo ?? target.AssignedTo;
                target.Status = workItem.Status ?? target.Status;
                turnState.Conversation.WorkItems = workItems;
            }

            return $"work item {workItem.Id} was updated. think about your next action";
        }

        private static WorkItem GetWorkItem(Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(parameters);

            WorkItem workItem =
                JsonSerializer.Deserialize<WorkItem>(JsonSerializer.Serialize(parameters))
                ?? throw new ArgumentException("Action data is not work item.");

            return workItem;
        }

        private static UserUpdate GetUserUpdate(Dictionary<string, object> parameters)
        {
            ArgumentNullException.ThrowIfNull(parameters);

            string content = JsonSerializer.Serialize(parameters);

            UserUpdate userUpdate = JsonSerializer.Deserialize<UserUpdate>(content)
                ?? throw new ArgumentException("Action data is not user update.");

            return userUpdate;
        }

        private static string[] RemoveAt(string[] IndicesArray, int RemoveAt)
        {
            string[] newIndicesArray = new string[IndicesArray.Length - 1];

            int i = 0;
            int j = 0;
            while (i < IndicesArray.Length)
            {
                if (i != RemoveAt)
                {
                    newIndicesArray[j] = IndicesArray[i];
                    j++;
                }

                i++;
            }

            return newIndicesArray;
        }
    }
}
