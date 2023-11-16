using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Additional options needed to use the Azure OpenAI service.
    /// </summary>
    /// <remarks>
    /// The Azure OpenAI API version is set to latest by default.
    /// </remarks>
    public class AzureOpenAIEmbeddingsOptions : OpenAIEmbeddingsOptions
    {
        /// <summary>
        /// Endpoint for your Azure OpenAI deployment.
        /// </summary>
        public new string Endpoint { get; set; }

        /// <summary>
        /// Create an instance of the AzureOpenAIEmbeddingsOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="model">The model to use for embeddings. This should be the model deployment name, not the model</param>
        /// <param name="endpoint">Endpoint for your Azure OpenAI deployment.</param>
        public AzureOpenAIEmbeddingsOptions(string apiKey, string model, string endpoint) : base(apiKey, model)
        {
            Verify.ParamNotNull(endpoint);

            Endpoint = endpoint;
        }
    }
}
