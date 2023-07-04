using Microsoft.Bot.Builder.M365.AI.Moderator;
using Microsoft.Bot.Builder.M365.Exceptions;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Runtime.Serialization;
using System.Text;
using System.Text.Json;

namespace Microsoft.Bot.Builder.M365.OpenAI
{
    /// <summary>
    /// The client to make calls to OpenAI's API
    /// </summary>
    public class OpenAIClient
    {
        private const string HttpUserAgent = "Microsoft Teams AI";
        private const string OpenAIModerationEndpoint = "https://api.openai.com/v1/moderations";

        private HttpClient _httpClient;
        private ILogger? _logger;
        private OpenAIClientOptions _options;

        public OpenAIClient(OpenAIClientOptions options, ILogger? logger = null, HttpClient? httpClient = null)
        {
            _httpClient = httpClient ?? new HttpClient();
            _logger = logger;
            _options = options;

        }

        /// <summary>
        /// Make a call to the OpenAI text moderation endpoint.
        /// </summary>
        /// <param name="text">The input text to moderate.</param>
        /// <returns>The moderation result from the API call.</returns>
        /// <exception cref="OpenAIClientException" />
        public async Task<ModerationResponse> ExecuteTextModeration(string text)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(new
                    {
                        model = _options.DefaultModel,
                        input = text 
                    }),
                    Encoding.UTF8,
                    "application/json"
                );

                HttpResponseMessage httpResponse = await _ExecutePostRequest(OpenAIModerationEndpoint, content);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                ModerationResponse result = JsonSerializer.Deserialize<ModerationResponse>(responseJson) ?? throw new SerializationException($"Failed to deserialize moderation result response json: {content}");
                
                return result;
            }
            catch (OpenAIClientException)
            {
                throw;
            }
            catch (Exception e)
            {
                throw new OpenAIClientException($"Something went wrong: {e.Message}");
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
                    request.Headers.Add("Authorization", $"Bearer {_options.ApiKey}");

                    if (_options.Organization != null)
                    {
                        request.Headers.Add("OpenAI-Organization", _options.Organization);
                    }

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

                throw new OpenAIClientException($"HTTP response failure status code: {(int)statusCode} ({failureReason})", statusCode);

            }
            catch (Exception e)
            {
                throw new OpenAIClientException($"Something went wrong {e.Message}");
            }

        }
    }
}
