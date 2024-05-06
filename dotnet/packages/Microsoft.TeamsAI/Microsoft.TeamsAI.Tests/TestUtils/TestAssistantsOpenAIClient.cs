using Azure;
using Azure.AI.OpenAI.Assistants;
using Moq;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class TestAssistantsOpenAIClient : AssistantsClient
    {
        public TestAssistantsOpenAIClient()
        {
        }

        public Assistant Assistant { get; set; } = AssistantsModelFactory.Assistant();

        public List<AssistantThread> Threads { get; set; } = new();

        public Dictionary<string, List<ThreadMessage>> Messages { get; set; } = new();

        public Dictionary<string, List<ThreadRun>> Runs { get; set; } = new();

        public Queue<RequiredAction> RemainingActions { get; set; } = new();

        public Queue<string> RemainingRunStatus { get; set; } = new();

        public Queue<string> RemainingMessages { get; set; } = new();

        public void Reset()
        {
            Threads.Clear();
            Messages.Clear();
            Runs.Clear();
            RemainingActions.Clear();
            RemainingRunStatus.Clear();
            RemainingMessages.Clear();
        }

        public override Task<Response<Assistant>> GetAssistantAsync(string assistantId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(Response.FromValue(Assistant, Mock.Of<Response>()));
        }

        public override Task<Response<AssistantThread>> CreateThreadAsync(AssistantThreadCreationOptions options, CancellationToken cancellationToken = default)
        {
            AssistantThread newThread = AssistantsModelFactory.AssistantThread(Guid.NewGuid().ToString(), DateTimeOffset.Now);
            Threads.Add(newThread);

            List<ThreadMessage> messages = new();
            var annotations = new List<MessageTextAnnotation>() { AssistantsModelFactory.MessageTextAnnotation() };
            foreach (var m in options.Messages)
            {
                ThreadMessage newMessage = AssistantsModelFactory.ThreadMessage(
                    Guid.NewGuid().ToString(),
                    DateTimeOffset.Now,
                    newThread.Id,
                    MessageRole.User,
                    new List<MessageContent>() { AssistantsModelFactory.MessageTextContent(m.Content, annotations) },
                    Assistant.Id,
                    null,
                    m.FileIds,
                    null
                );
                messages.Add(newMessage);
            }

            Messages.Add(newThread.Id, messages);
            Runs.Add(newThread.Id, new List<ThreadRun>());
            return Task.FromResult(Response.FromValue(newThread, Mock.Of<Response>()));
        }

        public override Task<Response<ThreadMessage>> CreateMessageAsync(string threadId, MessageRole role, string content, IEnumerable<string>? fileIds = null, IDictionary<string, string>? metadata = null, CancellationToken cancellationToken = default)
        {
            var annotations = new List<MessageTextAnnotation>() { AssistantsModelFactory.MessageTextAnnotation() };
            ThreadMessage newMessage = AssistantsModelFactory.ThreadMessage(
                Guid.NewGuid().ToString(),
                DateTimeOffset.Now,
                threadId,
                role,
                new List<MessageContent> { AssistantsModelFactory.MessageTextContent(content, annotations) },
                Assistant.Id,
                null,
                fileIds,
                null
            );

            if (Messages.ContainsKey(threadId))
            {
                Messages[threadId].Add(newMessage);
            }
            else
            {
                Messages.Add(threadId, new() { newMessage });
            };

            return Task.FromResult(Response.FromValue(newMessage, Mock.Of<Response>()));
        }

        public override async Task<Response<PageableList<ThreadMessage>>> GetMessagesAsync(string threadId, int? limit = null, ListSortOrder? order = null, string? after = null, string? before = null, CancellationToken cancellationToken = default)
        {
            while (RemainingMessages.Count > 0)
            {
                string nextMessage = RemainingMessages.Dequeue();
                await CreateMessageAsync(threadId, MessageRole.User, nextMessage);
            }

            string lastMessageId = before!;
            int i = Messages[threadId].FindIndex(m => m.Id == lastMessageId);
            int remainingItems = Messages[threadId].Count() - (i + 1);
            var filteredMessages = Messages[threadId].GetRange(i + 1, remainingItems);

            var p = AssistantsModelFactory.PageableList(filteredMessages, null, threadId, false);
            return Response.FromValue(p, Mock.Of<Response>());
        }

        public override Task<Response<ThreadRun>> CreateRunAsync(string threadId, CreateRunOptions createRunOptions, CancellationToken cancellationToken = default)
        {
            RequiredAction? remainingActions = null;

            if (RemainingActions.Count > 0)
            {
                remainingActions = RemainingActions.Dequeue();
            }

            var newRun = AssistantsModelFactory.ThreadRun(
                Guid.NewGuid().ToString(),
                threadId,
                createRunOptions.AssistantId,
                RunStatus.InProgress,
                remainingActions,
                null,
                createRunOptions.OverrideModelName,
                createRunOptions.OverrideInstructions,
                createRunOptions.OverrideTools
            );

            if (Runs.ContainsKey(threadId))
            {
                Runs[threadId].Add(newRun);
            }
            else
            {
                Runs.Add(threadId, new() { newRun });
            }

            return Task.FromResult(Response.FromValue(newRun, Mock.Of<Response>()));
        }

        public override Task<Response<ThreadRun>> GetRunAsync(string threadId, string runId, CancellationToken cancellationToken = default)
        {
            if (Runs[threadId].Count() == 0)
            {
                return Task.FromResult(Response.FromValue<ThreadRun>(null!, Mock.Of<Response>()));
            }

            RunStatus runStatus = RemainingRunStatus.Dequeue();
            int i = Runs[threadId].FindIndex(r => string.Equals(r.Id, runId));

            ThreadRun run = Runs[threadId][i];

            // Updates the runStatus. This cannot be done in the original run object.
            ThreadRun runWithUpdatedStatus = AssistantsModelFactory.ThreadRun(
                run.Id,
                run.ThreadId,
                run.AssistantId,
                runStatus,
                run.RequiredAction,
                null,
                run.Model,
                run.Instructions,
                run.Tools
            );

            Runs[threadId][i] = runWithUpdatedStatus;

            return Task.FromResult(Response.FromValue(runWithUpdatedStatus, Mock.Of<Response>()));
        }

        public override async Task<Response<PageableList<ThreadRun>>> GetRunsAsync(string threadId, int? limit = null, ListSortOrder? order = null, string? after = null, string? before = null, CancellationToken cancellationToken = default)
        {
            PageableList<ThreadRun> response;

            // AssistantsPlanner only needs the get the latest.
            if (Runs[threadId].Count() == 0)
            {
                response = AssistantsModelFactory.PageableList(new List<ThreadRun>(), "null", null, false);
                return Response.FromValue(response, Mock.Of<Response>());
            }

            int lastIndex = Runs[threadId].Count() - 1;
            ThreadRun run = Runs[threadId][lastIndex];
            ThreadRun runWithUpdatedStatus = await GetRunAsync(threadId, run.Id);

            response = AssistantsModelFactory.PageableList(new List<ThreadRun>() { runWithUpdatedStatus }, "null", null, false);
            return Response.FromValue(response, Mock.Of<Response>());
        }

        public override async Task<Response<ThreadRun>> SubmitToolOutputsToRunAsync(string threadId, string runId, IEnumerable<ToolOutput> toolOutputs, CancellationToken cancellationToken = default)
        {
            ThreadRun runWithUpdatedStatus = await GetRunAsync(threadId, runId);
            var response = runWithUpdatedStatus;
            return Response.FromValue(response, Mock.Of<Response>());
        }
    }
}
