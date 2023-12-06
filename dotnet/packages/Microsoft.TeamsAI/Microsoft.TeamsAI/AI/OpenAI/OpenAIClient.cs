using System.Collections.Specialized;
using System.Net;
using System.Runtime.CompilerServices;
using System.Runtime.Serialization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Web;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Teams.AI.AI.Moderator;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;

// For Unit Tests - so the Moq framework can mock internal classes
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]
namespace Microsoft.Teams.AI.AI.OpenAI
{
    /// <summary>
    /// The client to make calls to OpenAI's API
    /// </summary>
    internal partial class OpenAIClient
    {
        private const string HttpUserAgent = "Microsoft Teams AI";
        private const string OpenAIModerationEndpoint = "https://api.openai.com/v1/moderations";

        private HttpClient _httpClient;
        private ILogger _logger;
        private OpenAIClientOptions _options;
        private static readonly JsonSerializerOptions _serializerOptions = new()
        {
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        };

        /// <summary>
        /// Creates a new instance of the <see cref="OpenAIClient"/> class.
        /// </summary>
        /// <param name="options">The OpenAI client options.</param>
        /// <param name="loggerFactory">Optional. The logger factory instance.</param>
        /// <param name="httpClient">Optional. The HTTP client instance.</param>
        public OpenAIClient(OpenAIClientOptions options, ILoggerFactory? loggerFactory = null, HttpClient? httpClient = null)
        {
            _httpClient = httpClient ?? DefaultHttpClient.Instance;
            _logger = loggerFactory is null ? NullLogger.Instance : loggerFactory.CreateLogger(typeof(OpenAIClient));
            _options = options;
        }

        /// <summary>
        /// Make a call to the OpenAI text moderation endpoint.
        /// </summary>
        /// <param name="text">The input text to moderate.</param>
        /// <param name="model">The moderation model to use.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The moderation result from the API call.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<ModerationResponse> ExecuteTextModerationAsync(string text, string? model, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(new
                    {
                        model,
                        input = text
                    }, _serializerOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                using HttpResponseMessage httpResponse = await _ExecutePostRequestAsync(OpenAIModerationEndpoint, content, null, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                ModerationResponse result = JsonSerializer.Deserialize<ModerationResponse>(responseJson) ?? throw new SerializationException($"Failed to deserialize moderation result response json: {content}");

                return result;
            }
            catch (HttpOperationException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new TeamsAIException($"Something went wrong: {e.Message}", e);
            }
        }

        private async Task<HttpResponseMessage> _ExecuteGetRequestAsync(
            string url,
            IEnumerable<KeyValuePair<string, string>>? queries = null,
            IEnumerable<KeyValuePair<string, string>>? additionalHeaders = null,
            CancellationToken cancellationToken = default)
        {
            HttpResponseMessage? response = null;

            UriBuilder uriBuilder = new(url);
            if (queries != null)
            {
                NameValueCollection queryCollection = HttpUtility.ParseQueryString(uriBuilder.Query);
                foreach (KeyValuePair<string, string> query in queries)
                {
                    queryCollection.Add(query.Key, query.Value);
                }
                uriBuilder.Query = queryCollection.ToString();
            }

            using (HttpRequestMessage request = new(HttpMethod.Get, uriBuilder.ToString()))
            {
                request.Headers.Add("Accept", "application/json");
                request.Headers.Add("User-Agent", HttpUserAgent);
                request.Headers.Add("Authorization", $"Bearer {_options.ApiKey}");

                if (_options.Organization != null)
                {
                    request.Headers.Add("OpenAI-Organization", _options.Organization);
                }

                if (additionalHeaders != null)
                {
                    foreach (KeyValuePair<string, string> header in additionalHeaders)
                    {
                        request.Headers.Add(header.Key, header.Value);
                    }
                }

                response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
            }

            _logger.LogTrace($"HTTP response: {(int)response.StatusCode} {response.StatusCode:G}");

            // Throw an exception if not a success status code
            if (response.IsSuccessStatusCode)
            {
                return response;
            }

            HttpStatusCode statusCode = response.StatusCode;
            string failureReason = response.ReasonPhrase;
            response?.Dispose();

            throw new HttpOperationException($"HTTP response failure status code: {(int)statusCode} ({failureReason})", statusCode, failureReason);
        }

        private async Task<HttpResponseMessage> _ExecutePostRequestAsync(
            string url,
            HttpContent? content,
            IEnumerable<KeyValuePair<string, string>>? additionalHeaders = null,
            CancellationToken cancellationToken = default)
        {
            HttpResponseMessage? response = null;

            using (HttpRequestMessage request = new(HttpMethod.Post, url))
            {
                request.Headers.Add("Accept", "application/json");
                request.Headers.Add("User-Agent", HttpUserAgent);
                request.Headers.Add("Authorization", $"Bearer {_options.ApiKey}");

                if (_options.Organization != null)
                {
                    request.Headers.Add("OpenAI-Organization", _options.Organization);
                }

                if (additionalHeaders != null)
                {
                    foreach (KeyValuePair<string, string> header in additionalHeaders)
                    {
                        request.Headers.Add(header.Key, header.Value);
                    }
                }

                if (content != null)
                {
                    request.Content = content;
                }

                response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
            }

            _logger.LogTrace($"HTTP response: {(int)response.StatusCode} {response.StatusCode:G}");

            // Throw an exception if not a success status code
            if (response.IsSuccessStatusCode)
            {
                return response;
            }

            HttpStatusCode statusCode = response.StatusCode;
            string failureReason = response.ReasonPhrase;
            response?.Dispose();

            throw new HttpOperationException($"HTTP response failure status code: {(int)statusCode} ({failureReason})", statusCode, failureReason);
        }
    }
}
