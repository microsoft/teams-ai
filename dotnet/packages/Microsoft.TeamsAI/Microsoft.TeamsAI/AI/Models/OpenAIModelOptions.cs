using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Options for configuring an `OpenAIModel` to call an OpenAI hosted model.
    /// </summary>
    public class OpenAIModelOptions : BaseOpenAIModelOptions
    {
        /// <summary>
        /// API key to use when calling the OpenAI API.
        /// </summary>
        /// <remarks>
        /// A new API key can be created at https://platform.openai.com/account/api-keys.
        /// </remarks>
        public string ApiKey { get; set; }

        /// <summary>
        /// Default model to use for completion.
        /// </summary>
        /// <remarks>
        /// For Azure OpenAI this is the name of the deployment to use.
        /// </remarks>
        public string DefaultModel { get; set; }

        /// <summary>
        /// Optional. Organization to use when calling the OpenAI API.
        /// </summary>
        public string? Organization { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIModelOptions"/> class.
        /// </summary>
        /// <param name="apiKey">API key to use when calling the OpenAI API.</param>
        /// <param name="defaultModel">Default model to use for completion.</param>
        public OpenAIModelOptions(
            string apiKey,
            string defaultModel) : base()
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(defaultModel);

            this.ApiKey = apiKey;
            this.DefaultModel = defaultModel;
        }
    }
}
