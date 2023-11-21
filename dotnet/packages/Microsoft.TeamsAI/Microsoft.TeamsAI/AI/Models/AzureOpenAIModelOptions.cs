using Microsoft.Teams.AI.Utilities;
using Microsoft.Teams.AI.AI.Prompts;

namespace Microsoft.Teams.AI.AI.Models
{
    /// <summary>
    /// Options for configuring an `OpenAIModel` to call an Azure OpenAI hosted model.
    /// </summary>
    public class AzureOpenAIModelOptions : BaseOpenAIModelOptions
    {
        /// <summary>
        /// API key to use when making requests to Azure OpenAI.
        /// </summary>
        public string AzureApiKey { get; set; }

        /// <summary>
        /// Default name of the Azure OpenAI deployment (model) to use.
        /// </summary>
        public string AzureDefaultDeployment { get; set; }

        /// <summary>
        /// Deployment endpoint to use.
        /// </summary>
        public string AzureEndpoint { get; set; }

        /// <summary>
        /// Version of the API being called.
        /// </summary>
        public string AzureApiVersion { get; set; }

        /// <summary>
        /// Initializes a new instance of the <see cref="AzureOpenAIModelOptions"/> class.
        /// </summary>
        /// <param name="azureApiKey">API key to use when making requests to Azure OpenAI.</param>
        /// <param name="azureDefaultDeployment">Default name of the Azure OpenAI deployment (model) to use.</param>
        /// <param name="azureEndpoint">Deployment endpoint to use.</param>
        /// <param name="azureApiVersion">Version of the API being called.</param>
        /// <param name="completionType">Type of completion to use for the default model.</param>
        /// <param name="logRequests">Whether to log requests to the console.</param>
        /// <param name="retryPolicy">Retry policy to use when calling the OpenAI API.</param>
        /// <param name="useSystemMessages"></param>
        /// <exception cref="ArgumentException"></exception>
        public AzureOpenAIModelOptions(
            string azureApiKey,
            string azureDefaultDeployment,
            string azureEndpoint,
            string azureApiVersion = "2023-05-15",
            CompletionConfiguration.CompletionType completionType = CompletionConfiguration.CompletionType.Chat,
            bool logRequests = false,
            List<TimeSpan>? retryPolicy = null,
            bool useSystemMessages = false) : base(completionType, logRequests, retryPolicy, useSystemMessages)
        {
            Verify.ParamNotNull(azureApiKey);
            Verify.ParamNotNull(azureDefaultDeployment);
            Verify.ParamNotNull(azureEndpoint);

            azureEndpoint = azureEndpoint.Trim();
            if (!azureEndpoint.StartsWith("https://"))
            {
                throw new ArgumentException($"Model created with an invalid endpoint of `{azureEndpoint}`. The endpoint must be a valid HTTPS url.");
            }

            this.AzureApiKey = azureApiKey;
            this.AzureDefaultDeployment = azureDefaultDeployment;
            this.AzureEndpoint = azureEndpoint;
            this.AzureApiVersion = azureApiVersion;
        }
    }
}
