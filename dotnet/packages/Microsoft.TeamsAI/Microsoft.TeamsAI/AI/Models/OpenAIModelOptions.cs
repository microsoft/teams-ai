using Microsoft.Teams.AI.Utilities;
using Microsoft.Teams.AI.AI.Prompts;

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
        /// <param name="organization">Organization to use when calling the OpenAI API.</param>
        /// <param name="completionType">Type of completion to use for the default model.</param>
        /// <param name="logRequests">Whether to log requests to the console.</param>
        /// <param name="retryPolicy">Retry policy to use when calling the OpenAI API.</param>
        /// <param name="useSystemMessages"></param>
        public OpenAIModelOptions(
            string apiKey,
            string defaultModel,
            string? organization = null,
            CompletionConfiguration.CompletionType completionType = CompletionConfiguration.CompletionType.Chat,
            bool logRequests = false,
            List<TimeSpan>? retryPolicy = null,
            bool useSystemMessages = false) : base(completionType, logRequests, retryPolicy, useSystemMessages)
        {
            Verify.ParamNotNull(apiKey);
            Verify.ParamNotNull(defaultModel);

            this.ApiKey = apiKey;
            this.DefaultModel = defaultModel;
            this.Organization = organization;
        }
    }
}
