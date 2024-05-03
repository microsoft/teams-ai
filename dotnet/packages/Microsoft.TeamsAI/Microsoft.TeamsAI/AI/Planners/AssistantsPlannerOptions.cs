using Microsoft.Teams.AI.Utilities;

// Assistants API is currently in beta and is subject to change.
#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.Teams.AI.AI.Planners.Experimental
#pragma warning restore IDE0130 // Namespace does not match folder structure
{
    /// <summary>
    /// Options for the Assistants planner.
    /// </summary>
    public class AssistantsPlannerOptions
    {
        /// <summary>
        /// OpenAI API key or Azure OpenAI API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Optional. Azure OpenAI Endpoint.
        /// </summary>
        public string? Endpoint { get; set; }

        /// <summary>
        /// The Assistant ID.
        /// </summary>
        public string AssistantId { get; set; }

        /// <summary>
        /// Optional. OpenAI organization.
        /// </summary>
        public string? Organization { get; set; }

        /// <summary>
        /// Optional. The polling interval while waiting for the run to complete.
        /// If not provide, the default value is 1 second.
        /// </summary>
        public TimeSpan? PollingInterval { get; set; }

        /// <summary>
        /// Create an instance of the AssistantsPlannerOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key or Azure OpenAI API key.</param>
        /// <param name="assistantId">The Assistant ID.</param>
        /// <param name="endpoint">Optional. The Azure OpenAI Endpoint</param>
        public AssistantsPlannerOptions(string apiKey, string assistantId, string? endpoint = null)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(assistantId);

            ApiKey = apiKey;
            AssistantId = assistantId;
            Endpoint = endpoint;
        }
    }
}
