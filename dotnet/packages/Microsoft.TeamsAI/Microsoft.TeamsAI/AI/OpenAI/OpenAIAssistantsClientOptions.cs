
namespace Microsoft.Teams.AI.AI.OpenAI
{
    internal class OpenAIAssistantsClientOptions
    {
        /// <summary>
        /// OpenAI API key or Azure OpenAI API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Optional. Azure OpenAI Endpoint. Set this to use Azure OpenAI.
        /// </summary>
        public string? Endpoint { get; set; }

        /// <summary>
        /// Optional. OpenAI organization.
        /// </summary>
        public string? Organization { get; set; } = null;

        /// <summary>
        /// Create an instance of the OpenAIModeratorOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key or Azure OpenAI API key.</param>
        /// <param name="endpoint">Azure OpenAI Endpoint</param>
        public OpenAIAssistantsClientOptions(string apiKey, string? endpoint = null)
        {
            ApiKey = apiKey;
            Endpoint = endpoint;
        }
    }
}
