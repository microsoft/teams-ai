using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using System.Runtime.CompilerServices;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class TestAssistantsOpenAIClient : OpenAIClient
    {
        public TestAssistantsOpenAIClient() : base(new("test-ket"))
        {
        }

        public Assistant Assistant { get; set; } = new Assistant();

        public List<AI.OpenAI.Models.Thread> Threads { get; set; } = new();

        public Dictionary<string, List<Message>> Messages { get; set; } = new();

        public Dictionary<string, List<Run>> Runs { get; set; } = new();

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

        public override Task<Assistant> RetrieveAssistant(string assistantId, CancellationToken cancellationToken)
        {
            return Task.FromResult(Assistant);
        }

        public override Task<AI.OpenAI.Models.Thread> CreateThread(ThreadCreateParams threadCreateParams, CancellationToken cancellationToken)
        {
            AI.OpenAI.Models.Thread newThread = new()
            {
                Id = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.Now.Ticks / 1000,
                Metadata = threadCreateParams.Metadata,
            };
            Threads.Add(newThread);
            Messages.Add(
                newThread.Id,
                threadCreateParams.Messages == null ? new() : threadCreateParams.Messages.Select(m => new Message()
                {
                    Id = Guid.NewGuid().ToString(),
                    CreatedAt = DateTime.Now.Ticks / 1000,
                    Content = new() { new() { Type = "text", Text = new() { Value = m.Content } } },
                    Role = m.Role,
                    Metadata = m.Metadata,
                    FileIds = m.FileIds ?? new()
                }).ToList());
            Runs.Add(newThread.Id, new());
            return Task.FromResult(newThread);
        }

        public override Task<Message> CreateMessage(string threadId, MessageCreateParams messageCreateParams, CancellationToken cancellationToken)
        {
            Message newMessage = new()
            {
                Id = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.Now.Ticks / 1000,
                Content = new() { new() { Type = "text", Text = new() { Value = messageCreateParams.Content } } },
                Role = messageCreateParams.Role,
                Metadata = messageCreateParams.Metadata,
                FileIds = messageCreateParams.FileIds ?? new()
            };
            if (Messages.ContainsKey(threadId))
            {
                Messages[threadId].Add(newMessage);
            }
            else
            {
                Messages.Add(threadId, new() { newMessage });
            }

            return Task.FromResult(newMessage);
        }

        public override async IAsyncEnumerable<Message> ListNewMessages(string threadId, string? lastMessageId, [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            string nextMessage = RemainingMessages.Dequeue();
            await CreateMessage(threadId, new()
            {
                Content = nextMessage
            }, cancellationToken);
            List<Message> messages = Messages[threadId];
            bool start = lastMessageId == null;
            await foreach (var message in messages.ToAsyncEnumerable())
            {
                if (start)
                {
                    yield return message;
                }
                else
                {
                    if (string.Equals(message.Id, lastMessageId))
                    {
                        start = true;
                    }
                }
            }
        }

        public override Task<Run> CreateRun(string threadId, RunCreateParams runCreateParams, CancellationToken cancellationToken)
        {
            Run newRun = new()
            {
                Id = Guid.NewGuid().ToString(),
                CreatedAt = DateTime.Now.Ticks / 1000,
                AssistantId = runCreateParams.AssistantId,
                Instructions = runCreateParams.Instructions ?? string.Empty,
                Metadata = runCreateParams.Metadata,
                Model = runCreateParams.Model ?? string.Empty,
                Tools = runCreateParams.Tools ?? new(),
                ThreadId = threadId,
                Status = "in_progress",
            };
            if (RemainingActions.Count > 0)
            {
                newRun.RequiredAction = RemainingActions.Dequeue();
            }
            if (Runs.ContainsKey(threadId))
            {
                Runs[threadId].Add(newRun);
            }
            else
            {
                Runs.Add(threadId, new() { newRun });
            }

            return Task.FromResult(newRun);
        }

        public override Task<Run> RetrieveRun(string threadId, string runId, CancellationToken cancellationToken)
        {
            string nextStatus = RemainingRunStatus.Dequeue();
            Run run = Runs[threadId].First(r => string.Equals(r.Id, runId));
            run.Status = nextStatus;
            return Task.FromResult(run);
        }

        public override Task<Run?> RetrieveLastRun(string threadId, CancellationToken cancellationToken)
        {
            Run? run = Runs[threadId].LastOrDefault();
            if (run != null)
            {
                string nextStatus = RemainingRunStatus.Dequeue();
                run.Status = nextStatus;
            }
            return Task.FromResult(run);
        }

        public override async Task<Run> SubmitToolOutputs(string threadId, string runId, SubmitToolOutputsParams submitToolOutputsParams, CancellationToken cancellationToken)
        {
            Run run = await RetrieveRun(threadId, runId, cancellationToken);
            return run;
        }
    }
}
