using System.Net;
using Microsoft.Teams.AI.AI.OpenAI;
using Microsoft.Teams.AI.Exceptions;
using Microsoft.Teams.AI.Utilities;

namespace Microsoft.Teams.AI.Tests.AITests
{
    public class OpenAIClientTests
    {
        [Fact]
        public async Task Test_OpenAIClient_Uses_DefaultHttpClient()
        {
            // Arrange
            var response = new TestHttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{}")
            };
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            DefaultHttpClient.Instance = httpClient;
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"));

            // Action
            var result = await openAIClient.ExecuteTextModeration("test-text", "test-model");

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result.Results);
        }

        [Theory]
        [InlineData(HttpStatusCode.BadRequest)]
        [InlineData(HttpStatusCode.InternalServerError)]
        [InlineData(HttpStatusCode.TooManyRequests)]
        public async Task Test_ExecuteTextModeration_HttpResponseMessage_IsDisposed(HttpStatusCode statusCode)
        {
            // Arrange
            var response = new TestHttpResponseMessage(statusCode);
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            var openAIClient = new OpenAIClient(new OpenAIClientOptions("test-key"), null, httpClient);

            // Action
            var exception = await Assert.ThrowsAsync<HttpOperationException>(async () => await openAIClient.ExecuteTextModeration("test-text", "test-model"));

            // Assert
            Assert.NotNull(exception);
            Assert.Equal(statusCode, exception.StatusCode);
            Assert.True(response.Disposed);
        }

        private sealed class TestHttpResponseMessage : HttpResponseMessage
        {
            public bool Disposed { get; set; }

            public TestHttpResponseMessage(HttpStatusCode statusCode) : base(statusCode)
            {
            }

            protected override void Dispose(bool disposing)
            {
                Disposed = true;
                base.Dispose(disposing);
            }
        }

        private sealed class TestHttpMessageHandler : HttpMessageHandler
        {
            public HttpResponseMessage Response { get; set; } = new TestHttpResponseMessage(HttpStatusCode.OK);

            protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            {
                return Task.FromResult(Response);
            }
        }
    }
}
