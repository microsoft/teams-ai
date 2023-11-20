using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// Options for the Assistants planner.
    /// </summary>
    public class AssistantsPlannerOptions
    {
        /// <summary>
        /// OpenAI API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// The Assistant ID.
        /// </summary>
        public string AssistantId { get; set; }

        /// <summary>
        /// Optional. OpenAI organization.
        /// </summary>
        public string? Organization { get; set; }

        /// <summary>
        /// Optional. The polling interval while waiting for the run to complete, in milliseconds.
        /// If not provide, the default value is 1000.
        /// </summary>
        public int? PollingInterval { get; set; }

        /// <summary>
        /// Optional. The state path when access Assistants state in TurnState.
        /// If not provide, the default value is "conversation.assistants_state", which means Assistants state is stored in ConversationState, with sub-key "assistants_state".
        /// </summary>
        public string? AssistantsStateVariable { get; set; }

        /// <summary>
        /// Create an instance of the AssistantsPlannerOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="assistantId">The Assistant ID.</param>
        public AssistantsPlannerOptions(string apiKey, string assistantId)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(assistantId);

            ApiKey = apiKey;
            AssistantId = assistantId;
        }
    }
}
