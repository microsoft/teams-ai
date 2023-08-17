#pragma warning disable IDE0130 // Namespace does not match folder structure
namespace Microsoft.TeamsAI.OpenAI
#pragma warning restore IDE0130 // Namespace does not match folder structure
{
    public class OpenAIClientOptions
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
        /// Create an instance of the OpenAIModeratorOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        public OpenAIClientOptions(string apiKey)
        {
            ApiKey = apiKey;
        }
    }
}
