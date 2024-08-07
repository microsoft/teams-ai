using OpenAI.Assistants;
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
        private List<PageResult<T>> _result;
        internal PipelineResponse _pipelineResponse;

        public TestAsyncPageCollection(List<T> items, PipelineResponse response)
        {
            Items = items;
            _pipelineResponse = response;
            _result = new List<PageResult<T>>() { PageResult<T>.Create(Items, ContinuationToken.FromBytes(BinaryData.FromString("test")), null, response) };
        }

        protected override IAsyncEnumerator<PageResult<T>> GetAsyncEnumeratorCore(CancellationToken cancellationToken = default)
        {
            return _result.ToAsyncEnumerable().GetAsyncEnumerator();
        }

        protected override Task<PageResult<T>> GetCurrentPageAsyncCore()
        {
            return Task.FromResult(_result[0]);
        }
    }
}
