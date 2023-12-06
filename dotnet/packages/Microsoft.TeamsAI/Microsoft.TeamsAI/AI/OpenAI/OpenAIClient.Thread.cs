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
        private const string OpenAIThreadEndpoint = "https://api.openai.com/v1/threads";
        private static readonly IEnumerable<KeyValuePair<string, string>> LimitOneQuery =
            new List<KeyValuePair<string, string>> { new("limit", "1") }.AsReadOnly();

        /// <summary>
        /// Create a thread.
        /// </summary>
        /// <param name="threadCreateParams">The params to create the thread.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The created thread.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Models.Thread> CreateThreadAsync(ThreadCreateParams threadCreateParams, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(threadCreateParams, _serializerOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                using HttpResponseMessage httpResponse = await _ExecutePostRequestAsync(OpenAIThreadEndpoint, content, OpenAIBetaHeaders, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Models.Thread result = JsonSerializer.Deserialize<Models.Thread>(responseJson) ?? throw new SerializationException($"Failed to deserialize thread result response json: {responseJson}");

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
        /// Create a message in a thread.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="messageCreateParams">The params to create the message.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The created message.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Message> CreateMessageAsync(string threadId, MessageCreateParams messageCreateParams, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(messageCreateParams, _serializerOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                using HttpResponseMessage httpResponse = await _ExecutePostRequestAsync($"{OpenAIThreadEndpoint}/{threadId}/messages", content, OpenAIBetaHeaders, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Message result = JsonSerializer.Deserialize<Message>(responseJson) ?? throw new SerializationException($"Failed to deserialize message result response json: {responseJson}");

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
        /// List new messages of a thread.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="lastMessageId">The last message ID (exclude from the list results).</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The new messages ordered by created_at timestamp desc.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async IAsyncEnumerable<Message> ListNewMessagesAsync(string threadId, string? lastMessageId, [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            bool hasMore;
            string? before = lastMessageId;
            string? after = null;
            do
            {
                ListResponse<Message> listResult;
                try
                {
                    using HttpResponseMessage httpResponse = await _ExecuteGetRequestAsync($"{OpenAIThreadEndpoint}/{threadId}/messages", BuildListQuery(before, after), OpenAIBetaHeaders, cancellationToken);
                    string responseJson = await httpResponse.Content.ReadAsStringAsync();
                    listResult = JsonSerializer.Deserialize<ListResponse<Message>>(responseJson) ?? throw new SerializationException($"Failed to deserialize message list result response json: {responseJson}");
                }
                catch (HttpOperationException)
                {
                    throw;
                }
                catch (Exception e)
                {
                    throw new TeamsAIException($"Something went wrong: {e.Message}", e);
                }

                foreach (Message message in listResult.Data)
                {
                    yield return message;
                }

                hasMore = listResult.HasMore;
                if (hasMore)
                {
                    after = listResult.LastId;
                }
            } while (hasMore);
        }

        /// <summary>
        /// Create a run of a thread.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="runCreateParams">The params to create the run.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The created run.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Run> CreateRunAsync(string threadId, RunCreateParams runCreateParams, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(runCreateParams, _serializerOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                using HttpResponseMessage httpResponse = await _ExecutePostRequestAsync($"{OpenAIThreadEndpoint}/{threadId}/runs", content, OpenAIBetaHeaders, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Run result = JsonSerializer.Deserialize<Run>(responseJson) ?? throw new SerializationException($"Failed to deserialize run result response json: {responseJson}");

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
        /// Retrieve a run of a thread.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="runId">The run ID.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The run.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Run> RetrieveRunAsync(string threadId, string runId, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpResponseMessage httpResponse = await _ExecuteGetRequestAsync($"{OpenAIThreadEndpoint}/{threadId}/runs/{runId}", null, OpenAIBetaHeaders, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Run result = JsonSerializer.Deserialize<Run>(responseJson) ?? throw new SerializationException($"Failed to deserialize run result response json: {responseJson}");

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
        /// Retrieve the last run of a thread.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The last run if exist, otherwise null.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Run?> RetrieveLastRunAsync(string threadId, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpResponseMessage httpResponse = await _ExecuteGetRequestAsync($"{OpenAIThreadEndpoint}/{threadId}/runs", LimitOneQuery, OpenAIBetaHeaders, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                ListResponse<Run> result = JsonSerializer.Deserialize<ListResponse<Run>>(responseJson) ?? throw new SerializationException($"Failed to deserialize run list result response json: {responseJson}");

                return result.Data?.Count > 0 ? result.Data[0] : null;
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
        /// Submit tool outputs of a run.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="runId">The run ID.</param>
        /// <param name="submitToolOutputsParams">The params to submit.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The run.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Run> SubmitToolOutputsAsync(string threadId, string runId, SubmitToolOutputsParams submitToolOutputsParams, CancellationToken cancellationToken = default)
        {
            try
            {
                using HttpContent content = new StringContent(
                    JsonSerializer.Serialize(submitToolOutputsParams, _serializerOptions),
                    Encoding.UTF8,
                    "application/json"
                );

                using HttpResponseMessage httpResponse = await _ExecutePostRequestAsync($"{OpenAIThreadEndpoint}/{threadId}/runs/{runId}/submit_tool_outputs", content, OpenAIBetaHeaders, cancellationToken);

                string responseJson = await httpResponse.Content.ReadAsStringAsync();
                Run result = JsonSerializer.Deserialize<Run>(responseJson) ?? throw new SerializationException($"Failed to deserialize run result response json: {responseJson}");

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

        private List<KeyValuePair<string, string>> BuildListQuery(string? before, string? after)
        {
            List<KeyValuePair<string, string>> result = new();
            result.Add(new("order", "desc"));

            if (string.IsNullOrEmpty(before) && string.IsNullOrEmpty(after))
            {
                return result;
            }

            if (!string.IsNullOrEmpty(before))
            {
                result.Add(new("before", before!));
            }
            if (!string.IsNullOrEmpty(after))
            {
                result.Add(new("after", after!));
            }
            return result;
        }
    }
}
