using OpenAI.Assistants;
using System.ClientModel;
using System.ClientModel.Primitives;

namespace Microsoft.Teams.AI.Tests.TestUtils
{
    internal class OpenAIModelFactory
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

        public static ThreadRun CreateThreadRun(string threadId, string runStatus, string? runId = null, IList<RequiredAction> requiredActions = null)
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

    internal class TestRequiredAction : RequiredAction
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

    internal class TestAsyncPageableCollection<T> : AsyncPageableCollection<T> where T : class
    {
        public List<T> Items;

        internal PipelineResponse _pipelineResponse;

        public TestAsyncPageableCollection(List<T> items, PipelineResponse response)
        {
            Items = items;
            _pipelineResponse = response;
        }

#pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
        public override async IAsyncEnumerable<ResultPage<T>> AsPages(string? continuationToken = null, int? pageSizeHint = null)
#pragma warning restore CS1998 // Async method lacks 'await' operators and will run synchronously
        {
            yield return ResultPage<T>.Create(Items, null, _pipelineResponse);
        }
    }
}
