﻿using OpenAI.Assistants;
using OpenAI.Files;
using System.ClientModel;
using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal sealed class OpenAIModelFactory
    {
        public static RunCreationOptions CreateRunOptions()
        {
            return new RunCreationOptions();
        }

        public static RequiredAction CreateRequiredAction(string toolCallId, string functionName, string functionArguments)
        {
            return new TestRequiredAction(toolCallId, functionName, functionArguments);
        }

        public static Assistant CreateAssistant()
        {
            return ModelReaderWriter.Read<Assistant>(BinaryData.FromString(@$"{{
                ""id"": ""{Guid.NewGuid()}"",
                ""object"": ""assistant"",
                ""created_at"": {DateTime.Now.Second}
            }}"))!;
        }

        public static AssistantThread CreateAssistantThread(string guid, DateTimeOffset offset)
        {
            return ModelReaderWriter.Read<AssistantThread>(BinaryData.FromString(@$"{{
                ""id"": ""{guid}"",
                ""created_at"": {offset.Second}
            }}"))!;
        }

        public static ThreadMessage CreateThreadMessage(string threadId, string message)
        {
            var json = @$"{{
                ""id"": ""{Guid.NewGuid()}"",
                ""thread_id"": ""{threadId}"",
                ""created_at"": {DateTime.Now.Second},
                ""content"": [
                    {{
                        ""type"": ""text"",
                        ""text"": {{
                        ""value"": ""{message}"",
                        ""annotations"": []
                        }}
                    }}
                ]
            }}";
            return ModelReaderWriter.Read<ThreadMessage>(BinaryData.FromString(json))!;
        }

        public static MessageContent CreateMessageContent(string message, string fileId)
        {
            var json = @$"{{
                ""id"": ""test"",
                ""thread_id"": ""test"",
                ""created_at"": 0,
                ""content"": [
                    {{
                        ""type"": ""text"",
                        ""text"": {{
                            ""value"": ""{message}"",
                            ""annotations"": [
                                {{
                                    ""type"": ""file_citation"",
                                    ""file_citation"": {{
                                        ""file_id"": ""{fileId}""
                                    }}
                                }},
                                {{
                                    ""type"": ""file_path"",
                                    ""file_path"": {{
                                        ""file_id"": ""{fileId}""
                                    }}
                                }}
                            ]
                        }}
                    }}
                ]
            }}";

            // Unable to directly read `MessageContent`.
            var threadMessage = ModelReaderWriter.Read<ThreadMessage>(BinaryData.FromString(json))!;

            return threadMessage.Content[0];
        }

        public static OpenAIFileInfo CreateOpenAIFileInfo(string fileId)
        {
            var json = @$"{{
                ""id"": ""{fileId}"",
                ""object"": ""file"",
                ""bytes"": 120000,
                ""created_at"": 16761602,
                ""filename"": ""salesOverview.pdf"",
                ""purpose"": ""assistants""
            }}";

            var fileInfo = ModelReaderWriter.Read<OpenAIFileInfo>(BinaryData.FromString(json))!;

            return fileInfo;
        }

        public static ThreadRun CreateThreadRun(string threadId, string runStatus, string? runId = null, IList<RequiredAction> requiredActions = null!)
        {
            var raJson = "{}";
            if (requiredActions != null && requiredActions.Count > 0)
            {
                var toolCalls = requiredActions.Select((requiredAction) =>
                {
                    var ra = (TestRequiredAction)requiredAction;
                    return $@"{{
                        ""id"": ""{ra.ToolCallId}"",
                        ""type"": ""function"",
                        ""function"": {{
                            ""name"": ""{ra.FunctionName}"",
                            ""arguments"": ""{ra.FunctionArguments}""
                        }}
                    }}";
                });

                raJson = $@"{{
                    ""type"": ""submit_tool_outputs"",
                    ""submit_tool_outputs"": {{
                        ""tool_calls"": [
                            {string.Join(",", toolCalls)}
                        ]
                    }}
                }}
                ";
            }

            return ModelReaderWriter.Read<ThreadRun>(BinaryData.FromString(@$"{{
                ""id"": ""{runId ?? Guid.NewGuid().ToString()}"",
                ""thread_id"": ""{threadId}"",
                ""created_at"": {DateTime.Now.Second},
                ""status"": ""{runStatus}"",
                ""required_action"": {raJson}
            }}"))!;
        }
    }

    internal sealed class TestRequiredAction : RequiredAction
    {
        public new string FunctionName;

        public new string FunctionArguments;

        public new string ToolCallId;

        public TestRequiredAction(string toolCallId, string functionName, string functionArguments)
        {
            this.FunctionName = functionName;
            this.FunctionArguments = functionArguments;
            this.ToolCallId = toolCallId;
        }
    }

    internal sealed class TestAsyncPageCollection<T> : AsyncPageCollection<T> where T : class
    {
        public List<T> Items;
        internal PipelineResponse _pipelineResponse;
        private IAsyncEnumerator<PageResult<T>> _enumerator;

        public TestAsyncPageCollection(List<T> items, PipelineResponse response)
        {
            Items = items;
            _pipelineResponse = response;
            _enumerator = new TestAsyncEnumerator<T>(items, response);
        }

        protected override IAsyncEnumerator<PageResult<T>> GetAsyncEnumeratorCore(CancellationToken cancellationToken = default)
        {
            return _enumerator;
        }

        protected override Task<PageResult<T>> GetCurrentPageAsyncCore()
        {
            return Task.FromResult(_enumerator.Current);
        }
    }

    internal sealed class TestAsyncEnumerator<T> : IAsyncEnumerator<PageResult<T>> where T : class
    {
        private readonly List<T> _items;
        private readonly PipelineResponse _pipelineResponse;
        private bool _movedOnToNext;

        public TestAsyncEnumerator(List<T> items, PipelineResponse response)
        {
            _items = items;
            _pipelineResponse = response;
            _movedOnToNext = false;
        }

        public PageResult<T> Current => PageResult<T>.Create(_items, ContinuationToken.FromBytes(BinaryData.FromString("")), null, _pipelineResponse);

        public ValueTask DisposeAsync()
        {
            return new ValueTask();
        }

        public ValueTask<bool> MoveNextAsync()
        {
            if (!_movedOnToNext)
            {
                return new ValueTask<bool>(true);
            }
            else
            {
                _movedOnToNext = true;
                return new ValueTask<bool>(false);
            }

        }
    }

    internal sealed class TestAsyncResultCollection<T> : AsyncCollectionResult<T> where T : class
    {
        public List<T> Items = new();

        internal PipelineResponse _pipelineResponse;

        public TestAsyncResultCollection(T item, PipelineResponse response)
        {
            Items.Add(item);
            _pipelineResponse = response;
        }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
        public override async IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
        {
            yield return FromValue(Items[0], _pipelineResponse);
        }
    }
}
