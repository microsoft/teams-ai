using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.AI.OpenAI.Models;
using Microsoft.Teams.AI.Utilities;
using System.Net;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public partial class OpenAIClientTests
    {
        [Fact]
        public async Task Test_OpenAIClient_CreateAssistant()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""asst_test"",
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
            var result = await openAIClient.CreateAssistantAsync(new AssistantCreateParams
            {
                Instructions = "Your are a test bot",
                Model = "gpt-3.5-turbo"
            }, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("asst_test", result.Id);
            Assert.Equal(10000, result.CreatedAt);
        }

        [Fact]
        public async Task Test_OpenAIClient_RetrieveAssistant()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(@"{
  ""id"": ""asst_test"",
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
            var result = await openAIClient.RetrieveAssistantAsync("asst_test", CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("asst_test", result.Id);
            Assert.Equal(10000, result.CreatedAt);
        }
    }
}
