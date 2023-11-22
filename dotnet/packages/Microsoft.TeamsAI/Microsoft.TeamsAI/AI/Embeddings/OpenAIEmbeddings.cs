using Microsoft.Extensions.Logging;
using Microsoft.Teams.AI.State;
using Azure.AI.OpenAI;
using Azure;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.Utilities;
using Microsoft.Teams.AI.Exceptions;

namespace Microsoft.Teams.AI.AI.Embeddings
{
    /// <summary>
    /// Embeddings class that uses OpenAI's embeddings API.
    /// </summary>
    public class OpenAIEmbeddings<TState, TOptions> : IEmbeddings<TState>
        where TState : TurnState
        where TOptions : OpenAIEmbeddingsOptions
    {
        private TOptions _options { get; }
        private protected readonly OpenAIClient _client;
        private readonly ILogger _logger;

        /// <summary>
        /// Constructs an instance of the <see cref="OpenAIEmbeddings{TState, TOptions}"/> class.
        /// </summary>
        /// <param name="options">The options to configure the embeddings.</param>
        /// <param name="loggerFactory">Optional. The logger factory instance.</param>
        /// <exception cref="ArgumentException"></exception>
        public OpenAIEmbeddings(TOptions options, ILoggerFactory? loggerFactory = null)
        {
            _options = options;
            _client = _CreateOpenAIClient(options);
            _logger = loggerFactory is null ? NullLogger.Instance : loggerFactory.CreateLogger(typeof(OpenAIEmbeddings<TState, TOptions>));

            if (options.LogRequests && loggerFactory == null)
            {
                throw new ArgumentException($"`{nameof(loggerFactory)}` parameter cannot be null if `LogRequests` option is set to true");
            }
        }

        private OpenAIClient _CreateOpenAIClient(TOptions options)
        {
            Verify.ParamNotNull(options);
            if (options is OpenAIEmbeddingsOptions)
            {
                return new OpenAIClient(options.ApiKey);
            }
            else if (options is AzureOpenAIEmbeddingsOptions)
            {
                return new OpenAIClient(new Uri(options.Endpoint), new AzureKeyCredential(options.ApiKey));
            }
            else
            {
                throw new ArgumentException($"`{nameof(options)}` parameter must be of type `{nameof(OpenAIEmbeddingsOptions)}` or `{nameof(AzureOpenAIEmbeddingsOptions)}`");
            }
        }

        /// <inheritdoc/>
        public async Task<EmbeddingsResponse> CreateEmbeddings(IList<string> inputs)
        {
            if (this._options.LogRequests)
            {
                _logger?.LogInformation($"\nEmbeddings REQUEST: inputs={inputs}");
            }

            EmbeddingsOptions embeddingsOptions = new()
            {
                DeploymentName = _options.Model,
                Input = inputs,
            };

            try
            {
                DateTime startTime = DateTime.Now;
                Response<Azure.AI.OpenAI.Embeddings> response = await _client.GetEmbeddingsAsync(embeddingsOptions);
                List<ReadOnlyMemory<float>> embeddingItems = response.Value.Data.OrderBy(item => item.Index).Select(item => item.Embedding).ToList();

                if (this._options.LogRequests)
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
    }
}
