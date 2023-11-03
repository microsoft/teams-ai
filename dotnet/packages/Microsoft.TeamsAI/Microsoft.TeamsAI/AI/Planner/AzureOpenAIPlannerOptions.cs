using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Planner
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
        /// <param name="defaultModel">The default model to use. This should be the model deployment name, not the model</param>
        /// <param name="endpoint">Endpoint for your Azure OpenAI deployment.</param>
        public AzureOpenAIPlannerOptions(string apiKey, string defaultModel, string endpoint) : base(apiKey, defaultModel)
        {
            Verify.ParamNotNull(endpoint);

            Endpoint = endpoint;
        }
    }
}
