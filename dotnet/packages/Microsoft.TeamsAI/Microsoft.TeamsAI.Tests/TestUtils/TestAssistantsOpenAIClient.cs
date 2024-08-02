using OpenAI.Assistants;
using Moq;
using System.ClientModel;
using System.ClientModel.Primitives;
using OpenAI;

#pragma warning disable OPENAI001
namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class TestAssistantsOpenAIClient : AssistantClient
    {
        public TestAssistantsOpenAIClient()
        {
        }

        public Assistant Assistant { get; set; } = OpenAIModelFactory.CreateAssistant();

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

        //public override Task<Response<Assistant>> GetAssistantAsync(string assistantId, CancellationToken cancellationToken = default)
        //{
        //    return Task.FromResult(Response.FromValue(Assistant, Mock.Of<Response>()));
        //}

        public override Task<ClientResult<AssistantThread>> CreateThreadAsync(ThreadCreationOptions options, CancellationToken cancellationToken = default)
        {
            AssistantThread newThread = OpenAIModelFactory.CreateAssistantThread(Guid.NewGuid().ToString(), DateTimeOffset.Now);
            Threads.Add(newThread);

            List<ThreadMessage> messages = new();
            Messages.Add(newThread.Id, messages);
            Runs.Add(newThread.Id, new List<ThreadRun>());
            return Task.FromResult(ClientResult.FromValue(newThread, Mock.Of<PipelineResponse>()));
        }

        public override Task<ClientResult<ThreadMessage>> CreateMessageAsync(string threadId, MessageRole role, IEnumerable<MessageContent> content, MessageCreationOptions options = null, CancellationToken cancellationToken = default)
        {
            ThreadMessage newMessage = _CreateMessage(threadId, content.First().Text);

            return Task.FromResult(ClientResult.FromValue(newMessage, Mock.Of<PipelineResponse>()));
        }

        private ThreadMessage _CreateMessage(string threadId, string message)
        {
            ThreadMessage newMessage = OpenAIModelFactory.CreateThreadMessage(threadId, message);

            if (Messages.ContainsKey(threadId))
            {
                Messages[threadId].Add(newMessage);
            }
            else
            {
                Messages.Add(threadId, new() { newMessage });
            };

            return newMessage;
        }

        public override AsyncPageableCollection<ThreadMessage> GetMessagesAsync(string threadId, ListOrder? resultOrder = null, CancellationToken cancellationToken = default)
        {
            while (RemainingMessages.Count > 0)
            {
                string nextMessage = RemainingMessages.Dequeue();
                _CreateMessage(threadId, nextMessage);
            }

            // Sorted by oldest first
            List<ThreadMessage> messages = Messages[threadId].ToList();
            if (resultOrder != null && resultOrder.Value == ListOrder.NewestFirst)
            {
                messages.Reverse();
            }

            return new TestAsyncPageableCollection<ThreadMessage>(messages, Mock.Of<PipelineResponse>());
        }

        public override Task<ClientResult<ThreadRun>> CreateRunAsync(string threadId, string assistantId, RunCreationOptions createRunOptions, CancellationToken cancellationToken = default)
        {
            var newRun = OpenAIModelFactory.CreateThreadRun(threadId, "in_progress");

            if (Runs.ContainsKey(threadId))
            {
                Runs[threadId].Add(newRun);
            }
            else
            {
                Runs.Add(threadId, new() { newRun });
            }

            return Task.FromResult(ClientResult.FromValue(newRun, Mock.Of<PipelineResponse>()));
        }

        public override Task<ClientResult<ThreadRun>> GetRunAsync(string threadId, string runId, CancellationToken cancellationToken = default)
        {
            ThreadRun? run = _GetRun(threadId, runId);


            return Task.FromResult(ClientResult.FromValue(run, Mock.Of<PipelineResponse>()))!;
        }

        private ThreadRun? _GetRun(string threadId, string runId)
        {
            if (Runs[threadId].Count() == 0)
            {
                return null;
            }

            string runStatus = RemainingRunStatus.Dequeue();
            int i = Runs[threadId].FindIndex(r => string.Equals(r.Id, runId));

            ThreadRun run = Runs[threadId][i];

            List<RequiredAction> ras = new();
            if (runStatus == "requires_action")
            {
                while (RemainingActions.Count > 0)
                {
                    ras.Add(RemainingActions.Dequeue());
                }
            }

            // Updates the runStatus. This cannot be done in the original run object.
            ThreadRun runWithUpdatedStatus = OpenAIModelFactory.CreateThreadRun(
                run.ThreadId,
                runStatus,
                run.Id,
                ras
            );

            Runs[threadId][i] = runWithUpdatedStatus;

            return runWithUpdatedStatus;
        }

        public override AsyncPageableCollection<ThreadRun> GetRunsAsync(string threadId, ListOrder? resultOrder = null, CancellationToken cancellationToken = default)
        {
            AsyncPageableCollection<ThreadRun> response;

            // AssistantsPlanner only needs the get the latest.
            if (Runs[threadId].Count() == 0)
            {
                response = new TestAsyncPageableCollection<ThreadRun>(new List<ThreadRun>(), Mock.Of<PipelineResponse>());
                return response;
            }

            int lastIndex = Runs[threadId].Count() - 1;
            ThreadRun run = Runs[threadId][lastIndex];
            ThreadRun runWithUpdatedStatus = _GetRun(threadId, run.Id)!;

            response = new TestAsyncPageableCollection<ThreadRun>(new List<ThreadRun>() { runWithUpdatedStatus }, Mock.Of<PipelineResponse>());
            return response;
        }

        public override Task<ClientResult<ThreadRun>> SubmitToolOutputsToRunAsync(string threadId, string runId, IEnumerable<ToolOutput> toolOutputs, CancellationToken cancellationToken = default)
        {
            ThreadRun runWithUpdatedStatus = _GetRun(threadId, runId)!;
            var response = runWithUpdatedStatus;
            return Task.FromResult(ClientResult.FromValue(response, Mock.Of<PipelineResponse>()));
        }
    }
}
#pragma warning restore OPENAI001
