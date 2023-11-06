using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Planner
{
    /// <summary>
    /// Options for the OpenAI planner.
    /// </summary>
    public class OpenAIPlannerOptions
    {
        /// <summary>
        /// OpenAI API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Optional. OpenAI organization.
        /// </summary>
        public string? Organization { get; set; }

        /// <summary>
        /// Optional. OpenAI endpoint.
        /// </summary>
        public string? Endpoint { get; set; }

        /// <summary>
        /// The default model to use.
        /// </summary>
        /// <remarks>
        /// Prompts can override this model.
        /// </remarks>
        public string DefaultModel { get; set; }

        /// <summary>
        /// A flag indicating if the planner should only say one thing per turn.
        /// </summary>
        /// <remarks>
        /// The planner will attempt to combine multiple SAY commands into a single SAY command when true.
        /// Defaults to false.
        /// </remarks>
        public bool OneSayPerTurn { get; set; } = false;

        /// <summary>
        /// Optional. A flag indicating if the planner should use the 'system' role when calling OpenAI's
        /// chatCompletion API.
        /// </summary>
        /// <remarks>
        /// The planner currently uses the 'user' role by default as this tends to generate more reliable instruction following.
        /// Defaults to false.
        /// </remarks>
        public bool UseSystemMessage { get; set; } = false;

        /// <summary>
        /// A flag indicating if the planner should log requests with the provided logger.
        /// </summary>
        /// <remarks>
        /// Both the prompt text and the completion response will be logged.
        /// If this is set to true, a logger must be provided to the planner.
        /// Defaults to false.
        /// </remarks>
        public bool LogRequests { get; set; } = false;

        /// <summary>
        /// Create an instance of the OpenAIPlannerOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="defaultModel">The default model to use.</param>
        public OpenAIPlannerOptions(string apiKey, string defaultModel)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(defaultModel);

            ApiKey = apiKey;
            DefaultModel = defaultModel;
        }
    }
}
