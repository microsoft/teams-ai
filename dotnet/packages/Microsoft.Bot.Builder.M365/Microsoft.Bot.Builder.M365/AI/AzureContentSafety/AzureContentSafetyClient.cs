using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Bot.Builder.M365.Utilities;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Runtime.Serialization;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Microsoft.Bot.Builder.M365.AI.AzureContentSafety
{
    /// <summary>
    /// The client to make calls to Azure Content Safety API.
    /// </summary>
    public class AzureContentSafetyClient
    {
        private const string HttpUserAgent = "Microsoft Teams AI";

        private readonly HttpClient _httpClient;
        private readonly ILogger? _logger;
        private readonly AzureContentSafetyClientOptions _options;

        public AzureContentSafetyClient(AzureContentSafetyClientOptions options, ILogger? logger = null, HttpClient? httpClient = null)
        {
            _httpClient = httpClient ?? new HttpClient();
            _logger = logger;
            _options = options;
        }

        /// <summary>
        /// Make a call to the Azure Content Safety text analysis API.
        /// </summary>
        /// <param name="request">The <see cref="AzureContentSafetyTextAnalysisRequest">.</param>
        /// <returns>The <see cref="AzureContentSafetyTextAnalysisResponse"></returns>
        /// <exception cref="AzureContentSafetyClientException" />
        public virtual async Task<AzureContentSafetyTextAnalysisResponse> ExecuteTextModeration(AzureContentSafetyTextAnalysisRequest request)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(request, new JsonSerializerOptions()
                    {
                        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
                    }),
                    Encoding.UTF8,
                    "application/json"
                );

                string apiVersion = _options.ApiVersion ?? "2023-04-30-preview";
                string url = $"{_options.Endpoint}/contentsafety/text:analyze?api-version={apiVersion}";
                HttpResponseMessage httpResponse = await _ExecutePostRequest(url, content);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                AzureContentSafetyTextAnalysisResponse result = JsonSerializer.Deserialize<AzureContentSafetyTextAnalysisResponse>(responseJson) ?? throw new SerializationException($"Failed to deserialize moderation result response json: {content}");

                Verify.ParamNotNull(result.HateResult);
                return result;
            }
            catch (AzureContentSafetyClientException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new AzureContentSafetyClientException($"Something went wrong: {e.Message}");
            }
        }

        private async Task<HttpResponseMessage> _ExecutePostRequest(string url, HttpContent? content, CancellationToken cancellationToken = default)
        {
            try
            {
                HttpResponseMessage? response;

                using (HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, url))
                {
                    request.Headers.Add("Accept", "application/json");
                    request.Headers.Add("User-Agent", HttpUserAgent);
                    request.Headers.Add("Ocp-Apim-Subscription-Key", _options.ApiKey);

                    if (content != null)
                    {
                        request.Content = content;
                    }

                    response = await _httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
                }

                _logger?.LogTrace($"HTTP response: {(int)response.StatusCode} {response.StatusCode:G}");

                // Throw an exception if not a success status code
                if (response.IsSuccessStatusCode)
                {
                    return response;
                }

                HttpStatusCode statusCode = response.StatusCode;
                string failureReason = response.ReasonPhrase;

                throw new AzureContentSafetyClientException($"HTTP response failure status code: ${statusCode} ({failureReason})", statusCode);

            }
            catch (Exception e)
            {
                throw new AzureContentSafetyClientException($"Something went wrong {e.Message}");
            }

        }
    }
}
