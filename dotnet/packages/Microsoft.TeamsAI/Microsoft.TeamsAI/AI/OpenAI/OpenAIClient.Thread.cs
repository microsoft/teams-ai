using System.Runtime.CompilerServices;
using System.Runtime.Serialization;
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

        /// <summary>
        /// List new messages of a thread.
        /// </summary>
        /// <param name="threadId">The thread ID.</param>
        /// <param name="lastMessageId">The last message ID (exclude from the list results).</param>
        /// <returns>The new messages ordered by created_at timestamp desc.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async IAsyncEnumerable<ThreadMessage> ListNewMessages(string threadId, string? lastMessageId = null)
        {
            bool hasMore;
            string? before = lastMessageId;
            string? after = null;
            do
            {
                ListResponse<ThreadMessage> listResult;
                try
                {
                    using HttpResponseMessage httpResponse = await _ExecuteGetRequest($"{OpenAIThreadEndpoint}/{threadId}/messages", BuildListQuery(before, after), OpenAIBetaHeaders);
                    string responseJson = await httpResponse.Content.ReadAsStringAsync();
                    listResult = JsonSerializer.Deserialize<ListResponse<ThreadMessage>>(responseJson) ?? throw new SerializationException($"Failed to deserialize message list result response json: {responseJson}");
                }
                catch (HttpOperationException)
                {
                    throw;
                }
                catch (Exception e)
                {
                    throw new TeamsAIException($"Something went wrong: {e.Message}", e);
                }

                foreach (ThreadMessage message in listResult.Data)
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
