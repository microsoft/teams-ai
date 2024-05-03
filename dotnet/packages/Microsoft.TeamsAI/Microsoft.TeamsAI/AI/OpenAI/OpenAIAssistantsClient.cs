using System.Runtime.CompilerServices;
using Azure.AI.OpenAI.Assistants;
using Azure.Core;
using Microsoft.Teams.AI.AI.Models;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;
using Assistant = Microsoft.Teams.AI.AI.OpenAI.Models.Assistant;

// For Unit Tests - so the Moq framework can mock internal classes
[assembly: InternalsVisibleTo("DynamicProxyGenAssembly2")]
namespace Microsoft.Teams.AI.AI.OpenAI
{
    /// <summary>
    /// The client to make calls to OpenAI's API
    /// </summary>
    internal partial class OpenAIAssistantsClient
    {
        private readonly AssistantsClient _client;

        public OpenAIAssistantsClient(OpenAIAssistantsClientOptions options)
        {
            Verify.ParamNotNull(options);

            AssistantsClientOptions clientOptions = new();
            clientOptions.Diagnostics.IsLoggingEnabled = true;
            clientOptions.Diagnostics.ApplicationId = "Microsoft Teams AI";

            if (options.Endpoint != null)
            {
                // Azure OpenAI
                if (options.Organization != null)
                {
                    clientOptions.AddPolicy(new AddHeaderRequestPolicy("OpenAI-Organization", options.Organization), HttpPipelinePosition.PerCall);
                }
                _client = new AssistantsClient(new Uri(options.Endpoint), new Azure.AzureKeyCredential(options.ApiKey), clientOptions);
            }
            else
            {
                // OpenAI
                _client = new AssistantsClient(options.ApiKey, clientOptions);
            }
        }

        /// <summary>
        /// Create an OpenAI Assistant.
        /// </summary>
        /// <param name="assistantCreateParams">The params to create the Assistant.</param>
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The created Assistant.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Assistant> CreateAssistantAsync(AssistantCreateParams assistantCreateParams, CancellationToken cancellationToken = default)
        {
            try
            {
                AssistantCreationOptions options = assistantCreateParams.ToAssistantCreationOptions()!;
                Azure.AI.OpenAI.Assistants.Assistant result = await _client.CreateAssistantAsync(options, cancellationToken);
                return result.ToAssistant();
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
        /// <param name="cancellationToken">A cancellation token that can be used by other objects
        /// or threads to receive notice of cancellation.</param>
        /// <returns>The Assistant.</returns>
        /// <exception cref="HttpOperationException" />
        public virtual async Task<Assistant> RetrieveAssistantAsync(string assistantId, CancellationToken cancellationToken = default)
        {
            try
            {
                Azure.AI.OpenAI.Assistants.Assistant result = await _client.GetAssistantAsync(assistantId, cancellationToken);

                return result.ToAssistant();
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
                AssistantThreadCreationOptions options = threadCreateParams.ToAssistantThreadCreationOptions();
                AssistantThread assitantThread = await _client.CreateThreadAsync(options);

                return assitantThread.ToThread();
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
                IEnumerable<string>? fieldIds = messageCreateParams.FileIds;
                Dictionary<string, string>? metadata = messageCreateParams.Metadata;
                ThreadMessage result = await _client.CreateMessageAsync(threadId, new MessageRole(messageCreateParams.Role), messageCreateParams.Content, fieldIds, metadata, cancellationToken);

                return result.ToMessage();
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
                PageableList<ThreadMessage> listResult;
                try
                {
                    listResult = await _client.GetMessagesAsync(threadId, null, null, after, before);
                }
                catch (HttpOperationException)
                {
                    throw;
                }
                catch (Exception e)
                {
                    throw new TeamsAIException($"Something went wrong: {e.Message}", e);
                }

                foreach (ThreadMessage message in listResult)
                {
                    yield return message.ToMessage();
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
                Models.Thread thread = new() { Id = threadId };
                Assistant assistant = new() { Id = runCreateParams.AssistantId };

                ThreadRun result = await _client.CreateRunAsync(thread.ToAssistantThread(), assistant.ToAssistant(), cancellationToken);

                return result.ToRun()!;
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
                ThreadRun result = await _client.GetRunAsync(threadId, runId, cancellationToken);

                return result.ToRun()!;
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
                PageableList<ThreadRun> result = await _client.GetRunsAsync(threadId, 1, null, null, null, cancellationToken);

                return result.Count() > 0 ? result.First().ToRun() : null;
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
                Run run = new()
                {
                    Id = runId,
                    ThreadId = threadId
                };

                ThreadRun result = await _client.SubmitToolOutputsToRunAsync(run.ToThreadRun(), submitToolOutputsParams.ToToolOutputs(), cancellationToken);

                return result.ToRun()!;
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
