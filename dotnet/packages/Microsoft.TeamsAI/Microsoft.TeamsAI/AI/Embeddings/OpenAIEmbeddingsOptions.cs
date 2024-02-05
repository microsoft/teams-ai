using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Options for configuring an `OpenAIEmbeddings` to generate embeddings using an OpenAI hosted model.
    /// </summary>
    public class OpenAIEmbeddingsOptions : BaseOpenAIEmbeddingsOptions
    {
        /// <summary>
        /// API key to use when calling the OpenAI API.
        /// </summary>
        /// <remarks>
        /// A new API key can be created at https://platform.openai.com/account/api-keys.
        /// </remarks>
        public string ApiKey { get; set; }

        /// <summary>
        /// Model to use for embeddings.
        /// </summary>
        public string Model { get; set; }

        /// <summary>
        /// Optional. OpenAI organization.
        /// </summary>
        public string? Organization { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIEmbeddingsOptions"/> class.
        /// </summary>
        /// <param name="apiKey">API key to use when calling the OpenAI API.</param>
        /// <param name="model">Model to use for embeddings.</param>
        public OpenAIEmbeddingsOptions(string apiKey, string model)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(model);

            ApiKey = apiKey;
            Model = model;
        }
    }
}
