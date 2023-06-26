
namespace Microsoft.Bot.Builder.M365.AI.Moderator
{
    public class OpenAIModeratorOptions
    {
        /// <summary>
        /// OpenAI API key.
        /// </summary>
        public string ApiKey { get; set; }

        /// <summary>
        /// Which parts of the conversation to moderate
        /// </summary>
        public ModerationType Moderate { get; set; }

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
        /// Create an instance of the OpenAIModeratorOptions class.
        /// </summary>
        /// <param name="apiKey">OpenAI API key.</param>
        /// <param name="defaultModel">The default model to use.</param>
        public OpenAIModeratorOptions(string apiKey, ModerationType moderate, string defaultModel)
        {
            ApiKey = apiKey;
            Moderate = moderate;
            DefaultModel = defaultModel;
        }
    }

    public enum ModerationType
    {
        Input,
        Output,
        Both
    };
}
