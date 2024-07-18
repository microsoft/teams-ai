using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.AI.Models;
using OpenAI;
using ServiceVersion = Azure.AI.OpenAI.AzureOpenAIClientOptions.ServiceVersion;
using System.ClientModel.Primitives;
using Azure.AI.OpenAI;
using System.ClientModel;
using OpenAI.Embeddings;

namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// A `IEmbeddingsModel` for calling OpenAI and Azure OpenAI hosted models.
    /// </summary>
    public class OpenAIEmbeddings : IEmbeddingsModel
    {
        private readonly BaseOpenAIEmbeddingsOptions _options;
        private readonly ILogger _logger;

        private readonly OpenAIClient _openAIClient;
        private string _deploymentName;

        private static readonly string _userAgent = "AlphaWave";

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIEmbeddings"/> class.
        /// </summary>
        /// <param name="options">Options for configuring an `OpenAIEmbeddings` to call an OpenAI hosted model.</param>
        /// <param name="loggerFactory">The logger factory instance.</param>
        /// <param name="httpClient">HTTP client.</param>
        public OpenAIEmbeddings(OpenAIEmbeddingsOptions options, ILoggerFactory? loggerFactory = null, HttpClient? httpClient = null)
        {
            Verify.ParamNotNull(options);
            Verify.ParamNotNull(options.ApiKey, "OpenAIEmbeddingsOptions.ApiKey");
            Verify.ParamNotNull(options.Model, "OpenAIEmbeddingsOptions.Model");

            _options = new OpenAIEmbeddingsOptions(options.ApiKey, options.Model)
            {
                Organization = options.Organization,
                LogRequests = options.LogRequests ?? false,
                RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) },
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            OpenAIEmbeddingsOptions embeddingsOptions = (OpenAIEmbeddingsOptions)_options;
            OpenAIClientOptions openAIClientOptions = new()
            {
                RetryPolicy = new SequentialDelayRetryPolicy(embeddingsOptions.RetryPolicy!, embeddingsOptions.RetryPolicy!.Count)
            };

            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), PipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientPipelineTransport(httpClient);
            }

            if (!string.IsNullOrEmpty(embeddingsOptions.Organization))
            {
                openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", options.Organization!), PipelinePosition.PerCall);
            }
            _openAIClient = new OpenAIClient(new ApiKeyCredential(embeddingsOptions.ApiKey), openAIClientOptions);

            _deploymentName = options.Model;
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="OpenAIModel"/> class.
        /// </summary>
        /// <param name="options">Options for configuring an `OpenAIModel` to call an Azure OpenAI hosted model.</param>
        /// <param name="loggerFactory">The logger factory instance.</param>
        /// <param name="httpClient">HTTP client.</param>
        public OpenAIEmbeddings(AzureOpenAIEmbeddingsOptions options, ILoggerFactory? loggerFactory = null, HttpClient? httpClient = null)
        {
            Verify.ParamNotNull(options);
            Verify.ParamNotNull(options.AzureApiKey, "AzureOpenAIEmbeddingsOptions.AzureApiKey");
            Verify.ParamNotNull(options.AzureDeployment, "AzureOpenAIEmbeddingsOptions.AzureDeployment");
            Verify.ParamNotNull(options.AzureEndpoint, "AzureOpenAIEmbeddingsOptions.AzureEndpoint");

            string apiVersion = options.AzureApiVersion ?? "2024-06-01";
            ServiceVersion? serviceVersion = ConvertStringToServiceVersion(apiVersion);
            if (serviceVersion == null)
            {
                throw new ArgumentException($"Model created with an unsupported API version of `{apiVersion}`.");
            }

            _options = new AzureOpenAIEmbeddingsOptions(options.AzureApiKey, options.AzureDeployment, options.AzureEndpoint)
            {
                AzureApiVersion = apiVersion,
                LogRequests = options.LogRequests ?? false,
                RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) }
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();


            AzureOpenAIEmbeddingsOptions azureEmbeddingsOptions = (AzureOpenAIEmbeddingsOptions)_options;
            AzureOpenAIClientOptions azureOpenAIClientOptions = new(serviceVersion.Value)
            {
                RetryPolicy = new SequentialDelayRetryPolicy(_options.RetryPolicy, _options.RetryPolicy.Count)
            };

            azureOpenAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), PipelinePosition.PerCall);
            if (httpClient != null)
            {
                azureOpenAIClientOptions.Transport = new HttpClientPipelineTransport(httpClient);
            }

            _openAIClient = new AzureOpenAIClient(new Uri(azureEmbeddingsOptions.AzureEndpoint), new ApiKeyCredential(azureEmbeddingsOptions.AzureApiKey), azureOpenAIClientOptions);
            _deploymentName = options.AzureDeployment;
        }

        /// <inheritdoc/>
        public async Task<EmbeddingsResponse> CreateEmbeddingsAsync(IList<string> inputs, CancellationToken cancellationToken = default)
        {
            if (_options.LogRequests!.Value)
            {
                _logger?.LogInformation($"\nEmbeddings REQUEST: inputs={inputs}");
            }

            EmbeddingClient embeddingsClient = _openAIClient.GetEmbeddingClient(_deploymentName);

            try
            {
                DateTime startTime = DateTime.Now;
                ClientResult<EmbeddingCollection> response = await embeddingsClient.GenerateEmbeddingsAsync(inputs);
                List<ReadOnlyMemory<float>> embeddingItems = response.Value.OrderBy(item => item.Index).Select(item => item.Vector).ToList();

                if (_options.LogRequests!.Value)
                {
                    TimeSpan duration = DateTime.Now - startTime;
                    _logger?.LogInformation($"\nEmbeddings SUCCEEDED: duration={duration.TotalSeconds} response={embeddingItems}");
                }

                return new EmbeddingsResponse
                {
                    Status = EmbeddingsResponseStatus.Success,
                    Output = embeddingItems,
                };
            }
            catch (ClientResultException ex) when (ex.Status == 429)
            {
                return new EmbeddingsResponse
                {
                    Status = EmbeddingsResponseStatus.RateLimited,
                    Message = $"The embeddings API returned a rate limit error",
                };
            }
            catch (ClientResultException ex)
            {
                return new EmbeddingsResponse
                {
                    Status = EmbeddingsResponseStatus.Failure,
                    Message = $"The embeddings API returned an error status of: {ex.Status}: {ex.Message}",
                };
            }
            catch (Exception ex)
            {
                throw new TeamsAIException($"Error while executing openAI Embeddings execution: {ex.Message}", ex);
            }
        }

        private ServiceVersion? ConvertStringToServiceVersion(string apiVersion)
        {
            return apiVersion switch
            {
                "2024-04-01-preview" => ServiceVersion.V2024_04_01_Preview,
                "2024-05-01-preview" => ServiceVersion.V2024_05_01_Preview,
                "2024-06-01" => ServiceVersion.V2024_06_01,
                _ => null,
            };
        }
    }
}
