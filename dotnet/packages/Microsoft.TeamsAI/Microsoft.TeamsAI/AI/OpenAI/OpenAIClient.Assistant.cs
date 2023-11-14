using System.Runtime.CompilerServices;
using System.Runtime.Serialization;
using System.Text;
using System.Text.Json;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using Microsoft.Teams.AI.Exceptions;

// For Unit Tests - so the Moq framework can mock internal classes
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]
namespace Microsoft.Teams.AI.AI.OpenAI
{
    /// <summary>
    /// The client to make calls to OpenAI's API
    /// </summary>
    internal partial class OpenAIClient
    {
        private const string OpenAIAssistantEndpoint = "https://api.openai.com/v1/assistants";
        private static readonly IEnumerable<KeyValuePair<string, string>> OpenAIBetaHeaders =
            new List<KeyValuePair<string, string>> { new("OpenAI-Beta", "assistants=v1") }.AsReadOnly();

        /// <summary>
        /// Create an OpenAI Assistant.
        /// </summary>
        /// <param name="assistantCreateParams">The params to create the Assistant.</param>
        /// <returns>The created Assistant.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Assistant> CreateAssistant(AssistantCreateParams assistantCreateParams)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(assistantCreateParams, _serializerOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                using HttpResponseMessage httpResponse = await _ExecutePostRequest(OpenAIAssistantEndpoint, content, OpenAIBetaHeaders);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Assistant result = JsonSerializer.Deserialize<Assistant>(responseJson) ?? throw new SerializationException($"Failed to deserialize assistant result response json: {responseJson}");

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

        /// <summary>
        /// Retrieve an OpenAI Assistant.
        /// </summary>
        /// <param name="assistantId">The Assistant ID.</param>
        /// <returns>The Assistant.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Assistant> RetrieveAssistant(string assistantId)
        {
            try
            {
                using HttpResponseMessage httpResponse = await _ExecuteGetRequest($"{OpenAIAssistantEndpoint}/{assistantId}", null, OpenAIBetaHeaders);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Assistant result = JsonSerializer.Deserialize<Assistant>(responseJson) ?? throw new SerializationException($"Failed to deserialize assistant result response json: {responseJson}");

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
    }
}
