using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using Microsoft.Teams.AI.Utilities;
using System.Net;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public partial class OpenAIClientTests
    {
        [Fact]
        public async Task Test_OpenAIClient_CreateThread()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""thread_test"",
  ""created_at"": 10000
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.CreateThreadAsync(new ThreadCreateParams(), CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("thread_test", result.Id);
            Assert.Equal(10000, result.CreatedAt);
        }

        [Fact]
        public async Task Test_OpenAIClient_CreateMessage()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""msg_test"",
  ""created_at"": 10000,
  ""role"": ""user"",
  ""content"": [
    {
      ""type"": ""text"",
      ""text"": {
        ""value"": ""hello""
      }
    }
  ]
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.CreateMessageAsync("thread_test", new MessageCreateParams
            {
                Content = "hello"
            }, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("msg_test", result.Id);
            Assert.Equal(10000, result.CreatedAt);
            Assert.Equal("user", result.Role);
            Assert.Equal("hello", result.Content.FirstOrDefault()?.Text?.Value);
        }

        [Fact]
        public async Task Test_OpenAIClient_ListNewMessages()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""data"": [
    {
      ""id"": ""msg_2""
    },
    {
      ""id"": ""msg_1""
    }
  ],
  ""first_id"": ""msg_2"",
  ""last_id"": ""msg_1"",
  ""has_more"": false
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.ListNewMessagesAsync("thread_1", "msg_0", CancellationToken.None).ToListAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("msg_2", result[0].Id);
            Assert.Equal("msg_1", result[1].Id);
        }

        [Fact]
        public async Task Test_OpenAIClient_CreateRun()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""run_test"",
  ""assistant_id"": ""asst_test"",
  ""created_at"": 10000
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.CreateRunAsync("thread_test", new RunCreateParams
            {
                AssistantId = "asst_test"
            }, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("run_test", result.Id);
            Assert.Equal("asst_test", result.AssistantId);
            Assert.Equal(10000, result.CreatedAt);
        }

        [Fact]
        public async Task Test_OpenAIClient_RetrieveRun()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""run_test"",
  ""assistant_id"": ""asst_test"",
  ""created_at"": 10000
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.RetrieveRunAsync("thread_test", "run_test", CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("run_test", result.Id);
            Assert.Equal("asst_test", result.AssistantId);
            Assert.Equal(10000, result.CreatedAt);
        }

        [Fact]
        public async Task Test_OpenAIClient_RetrieveLastRun()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""data"": [
    {
      ""id"": ""run_test""
    }
  ],
  ""first_id"": ""run_test"",
  ""last_id"": ""run_test"",
  ""has_more"": false
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.RetrieveLastRunAsync("thread_test", CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("run_test", result.Id);
        }

        [Fact]
        public async Task Test_OpenAIClient_RetrieveLastRun_NullResult()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""data"": [],
  ""has_more"": false
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.RetrieveLastRunAsync("thread_test", CancellationToken.None);

            // Assert
            Assert.Null(result);
        }

        [Fact]
        public async Task Test_OpenAIClient_SubmitToolOutputs()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""run_test"",
  ""assistant_id"": ""asst_test"",
  ""created_at"": 10000
}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.SubmitToolOutputsAsync("thread_test", "run_test", new SubmitToolOutputsParams
            {
                ToolOutputs = new List<ToolOutput>
                {
                    new()
                }
            }, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("run_test", result.Id);
            Assert.Equal("asst_test", result.AssistantId);
            Assert.Equal(10000, result.CreatedAt);
        }
    }
}
