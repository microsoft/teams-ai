using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Options for the OpenAI embeddings.
    /// </summary>
    public class OpenAIEmbeddingsOptions
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
        /// Model to use for embeddings.
        /// </summary>
        /// <remarks>
        /// For Azure OpenAI this is the name of the deployment to use.
        /// </remarks>
        public string Model { get; set; }

        /// <summary>
        /// A flag indicating if the planner should log requests with the provided logger.
        /// </summary>
        /// <remarks>
        /// This is useful for debugging prompts and defaults to `false`.
        /// </remarks>
        public bool LogRequests { get; set; } = false;

        /// <summary>
        /// Create an instance of the OpenAIEmbeddingsOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="model">The model to use.</param>
        public OpenAIEmbeddingsOptions(string apiKey, string model)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(model);

            ApiKey = apiKey;
            Model = model;
        }
    }
}
