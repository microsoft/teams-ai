using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.Utilities;
using System.Net;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public partial class OpenAIClientTests
    {
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
            var result = await openAIClient.ListNewMessages("thread_1", "msg_0").ToListAsync();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count);
            Assert.Equal("msg_2", result[0].Id);
            Assert.Equal("msg_1", result[1].Id);
        }
    }
}
