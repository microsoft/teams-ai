using Microsoft.Extensions.Logging;
using Azure.AI.OpenAI;
using Azure;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.AI.Models;
using Azure.Core.Pipeline;
using Azure.Core;
using static Azure.AI.OpenAI.OpenAIClientOptions;

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
                RetryPolicy = options.RetryPolicy ?? new List<TimeSpan> { TimeSpan.FromMilliseconds(2000), TimeSpan.FromMilliseconds(5000) }
            };
            _logger = loggerFactory == null ? NullLogger.Instance : loggerFactory.CreateLogger<OpenAIModel>();

            OpenAIClientOptions openAIClientOptions = new()
            {
                RetryPolicy = new RetryPolicy(_options.RetryPolicy!.Count, new SequentialDelayStrategy(_options.RetryPolicy))
            };
            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), HttpPipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientTransport(httpClient);
            }
            OpenAIEmbeddingsOptions openAIModelOptions = (OpenAIEmbeddingsOptions)_options;
            if (!string.IsNullOrEmpty(openAIModelOptions.Organization))
            {
                openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", openAIModelOptions.Organization!), HttpPipelinePosition.PerCall);
            }
            _openAIClient = new OpenAIClient(openAIModelOptions.ApiKey, openAIClientOptions);

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

            string apiVersion = options.AzureApiVersion ?? "2023-05-15";
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

            OpenAIClientOptions openAIClientOptions = new(serviceVersion.Value)
            {
                RetryPolicy = new RetryPolicy(_options.RetryPolicy!.Count, new SequentialDelayStrategy(_options.RetryPolicy))
            };
            openAIClientOptions.AddPolicy(new AddHeaderRequestPolicy("User-Agent", _userAgent), HttpPipelinePosition.PerCall);
            if (httpClient != null)
            {
                openAIClientOptions.Transport = new HttpClientTransport(httpClient);
            }
            AzureOpenAIEmbeddingsOptions azureOpenAIModelOptions = (AzureOpenAIEmbeddingsOptions)_options;
            _openAIClient = new OpenAIClient(new Uri(azureOpenAIModelOptions.AzureEndpoint), new AzureKeyCredential(azureOpenAIModelOptions.AzureApiKey), openAIClientOptions);

            _deploymentName = options.AzureDeployment;
        }

        /// <inheritdoc/>
        public async Task<EmbeddingsResponse> CreateEmbeddingsAsync(IList<string> inputs, CancellationToken cancellationToken = default)
        {
            if (_options.LogRequests!.Value)
            {
                _logger?.LogInformation($"\nEmbeddings REQUEST: inputs={inputs}");
            }

            EmbeddingsOptions embeddingsOptions = new(_deploymentName, inputs);

            try
            {
                DateTime startTime = DateTime.Now;
                Response<Azure.AI.OpenAI.Embeddings> response = await _openAIClient.GetEmbeddingsAsync(embeddingsOptions, cancellationToken);
                List<ReadOnlyMemory<float>> embeddingItems = response.Value.Data.OrderBy(item => item.Index).Select(item => item.Embedding).ToList();

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
            catch (RequestFailedException ex) when (ex.Status == 429)
            {
                return new EmbeddingsResponse
                {
                    Status = EmbeddingsResponseStatus.RateLimited,
                    Message = $"The embeddings API returned a rate limit error",
                };
            }
            catch (RequestFailedException ex)
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
            switch (apiVersion)
            {
                case "2022-12-01": return ServiceVersion.V2022_12_01;
                case "2023-05-15": return ServiceVersion.V2023_05_15;
                case "2023-06-01-preview": return ServiceVersion.V2023_06_01_Preview;
                case "2023-07-01-preview": return ServiceVersion.V2023_07_01_Preview;
                case "2024-02-15-preview": return ServiceVersion.V2024_02_15_Preview;
                case "2024-03-01-preview": return ServiceVersion.V2024_03_01_Preview;
                default:
                    return null;
            }
        }
    }
}
