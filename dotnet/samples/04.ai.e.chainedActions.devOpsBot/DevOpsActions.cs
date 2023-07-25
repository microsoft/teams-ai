using Microsoft.Bot.Builder;
using Microsoft.TeamsAI;
using Microsoft.TeamsAI.AI.Action;

using DevOpsBot.Model;

namespace DevOpsBot
{
    public class DevOpsActions
    {
        private readonly Application<DevOpsState, DevOpsStateManager> _application;

        public DevOpsActions(Application<DevOpsState, DevOpsStateManager> application)
        {
            _application = application;
        }

        [Action("CreateWI")]
        public async Task<bool> CreateWI([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] DevOpsState turnState, [ActionEntities] EntityData data)
        {
            _ = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
            _ = turnState ?? throw new ArgumentNullException(nameof(turnState));
            _ = data ?? throw new ArgumentNullException(nameof(data));

            int id = CreateNewWorkItem(turnState, data);
            await turnContext.SendActivityAsync($"New work item created with ID: {id} and assigned to: {data.AssignedTo}").ConfigureAwait(false);
            return false;
        }

        [Action("AssignWI")]
        public bool AssignWI([ActionTurnState] DevOpsState turnState, [ActionEntities] EntityData data)
        {
            _ = turnState ?? throw new ArgumentNullException(nameof(turnState));
            _ = data ?? throw new ArgumentNullException(nameof(data));

            AssignWorkItem(turnState, data);
            return true;
        }

        [Action("UpdateWI")]
        public bool UpdateWI([ActionTurnState] DevOpsState turnState, [ActionEntities] EntityData data)
        {
            _ = turnState ?? throw new ArgumentNullException(nameof(turnState));
            _ = data ?? throw new ArgumentNullException(nameof(data));

            UpdateWorkItem(turnState, data);
            return true;
        }

        [Action("TriageWI")]
        public bool TriageWI([ActionTurnState] DevOpsState turnState, [ActionEntities] EntityData data)
        {
            _ = turnState ?? throw new ArgumentNullException(nameof(turnState));
            _ = data ?? throw new ArgumentNullException(nameof(data));

            TriageWorkItem(turnState, data);
            return true;
        }

        [Action("Summarize")]
        public async Task<bool> Summarize([ActionTurnContext] ITurnContext turnContext, [ActionTurnState] DevOpsState turnState)
        {
            _ = turnContext ?? throw new ArgumentNullException(nameof(turnContext));
            _ = turnState ?? throw new ArgumentNullException(nameof(turnState));

            EntityData[] workItems = turnState.Conversation!.WorkItems;
            if (workItems.Length > 0)
            {
                // Chain into a new summarization prompt
                await _application.AI.ChainAsync(turnContext, turnState, "Summarize").ConfigureAwait(false);
            }
            else
            {
                await turnContext.SendActivityAsync(ResponseBuilder.NoListFound()).ConfigureAwait(false);
            }

            // End the current chain
            return false;
        }

        [Action(DefaultActionTypes.UnknownActionName)]
        public async Task<bool> UnknownAction([ActionTurnContext] ITurnContext turnContext, [ActionName] string action)
        {
            _ = turnContext ?? throw new ArgumentNullException(nameof(turnContext));

            await turnContext.SendActivityAsync(ResponseBuilder.UnknownAction(action)).ConfigureAwait(false);
            return false;
        }

        /// <summary>
        /// This method is used to create new work item.
        /// </summary>
        /// <param name="turnState">The application turn state.</param>
        /// <param name="workItemInfo">Data containing the work item information.</param>
        /// <returns>The ID of the newly created work item.</returns>
        private static int CreateNewWorkItem(DevOpsState turnState, EntityData workItemInfo)
        {
            if (workItemInfo.Id == 0)
            {
                workItemInfo.Id = turnState.Conversation!.WorkItems.Length + 1;
            }
            workItemInfo.Status = "Proposed";
            turnState.Conversation!.WorkItems = turnState.Conversation!.WorkItems.Concat(new[] { workItemInfo }).ToArray();
            return workItemInfo.Id;
        }

        /// <summary>
        /// This method is used to assign a work item to a person.
        /// </summary>
        /// <param name="turnState">The application turn state.</param>
        /// <param name="workItemInfo">Data containing the work item information.</param>
        private static void AssignWorkItem(DevOpsState turnState, EntityData workItemInfo)
        {
            EntityData[] workItems = turnState.Conversation!.WorkItems;
            if (workItemInfo.Id != 0)
            {
                EntityData? target = workItems.FirstOrDefault(item => item.Id == workItemInfo.Id);
                if (target != null)
                {
                    target.AssignedTo = workItemInfo.AssignedTo;

                    // Set back to state to be persisted
                    turnState.Conversation!.WorkItems = workItems;
                }
            }
        }

        /// <summary>
        /// This method is used to triage work item.
        /// </summary>
        /// <param name="turnState">The application turn state.</param>
        /// <param name="workItemInfo">Data containing the work item information.</param>
        private static void TriageWorkItem(DevOpsState turnState, EntityData workItemInfo)
        {
            EntityData[] workItems = turnState.Conversation!.WorkItems;
            if (workItemInfo.Id != 0)
            {
                EntityData? target = workItems.FirstOrDefault(item => item.Id == workItemInfo.Id);
                if (target != null)
                {
                    target.Status = workItemInfo.Status;

                    // Set back to state to be persisted
                    turnState.Conversation!.WorkItems = workItems;
                }
            }
        }

        /// <summary>
        /// This method is used to update the existing work item.
        /// </summary>
        /// <param name="turnState">The application turn state.</param>
        /// <param name="workItemInfo">Data containing the work item information.</param>
        private static void UpdateWorkItem(DevOpsState turnState, EntityData workItemInfo)
        {
            EntityData[] workItems = turnState.Conversation!.WorkItems;
            if (workItemInfo.Id != 0)
            {
                EntityData? target = workItems.FirstOrDefault(item => item.Id == workItemInfo.Id);
                if (target != null)
                {
                    target.Title = workItemInfo.Title ?? target.Title;
                    target.AssignedTo = workItemInfo.AssignedTo ?? target.AssignedTo;
                    target.Status = workItemInfo.Status ?? target.Status;

                    // Set back to state to be persisted
                    turnState.Conversation!.WorkItems = workItems;
                }
            }
        }
    }
}
