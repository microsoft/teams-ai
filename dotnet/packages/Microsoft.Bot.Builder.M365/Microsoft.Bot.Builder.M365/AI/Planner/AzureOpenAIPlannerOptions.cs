using Microsoft.Bot.Builder.M365.Utilities;

namespace Microsoft.Bot.Builder.M365.AI.Planner
{
    /// <summary>
    /// Additional options needed to use the Azure OpenAI service.
    /// </summary>
    /// <remarks>
    /// The Azure OpenAI API version is set to latest by default.
    /// </remarks>
    public class AzureOpenAIPlannerOptions : OpenAIPlannerOptions
    {
        /// <summary>
        /// Endpoint for your Azure OpenAI deployment.
        /// </summary>
        public new string Endpoint { get; set; }

        /// <summary>
        /// Create an instance of the OpenAIPlannerOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="defaultModel">The default model to use.</param>
        public AzureOpenAIPlannerOptions(string apiKey, string defaultModel, string endpoint) : base(apiKey, defaultModel)
        {
            Verify.NotNull(endpoint, nameof(endpoint));

            Endpoint = endpoint;
        }
    }
}
