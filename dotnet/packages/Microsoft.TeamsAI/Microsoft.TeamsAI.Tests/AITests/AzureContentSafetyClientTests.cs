using System.Net;
using Microsoft.TeamsAI.AI.AzureContentSafety;
using Microsoft.TeamsAI.Exceptions;
using Microsoft.TeamsAI.Utilities;

namespace Microsoft.TeamsAI.Tests.AITests
{
    public class AzureContentSafetyClientTests
    {
        [Fact]
        public async Task Test_AzureContentSafetyClient_Uses_DefaultHttpClient()
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
            var azureContentSafetyClient = new AzureContentSafetyClient(new AzureContentSafetyClientOptions("test-key", "https://test-endpoint"));

            // Action
            var result = await azureContentSafetyClient.ExecuteTextModeration(new AzureContentSafetyTextAnalysisRequest("test-text"));

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result.BlocklistsMatchResults);
            Assert.Null(result.HateResult);
            Assert.Null(result.SelfHarmResult);
            Assert.Null(result.SexualResult);
            Assert.Null(result.ViolenceResult);
        }

        [Theory]
        [InlineData(HttpStatusCode.BadRequest)]
        [InlineData(HttpStatusCode.InternalServerError)]
        [InlineData(HttpStatusCode.TooManyRequests)]
        public async Task Test_ExecuteTextModeration_HttpResponseMessage_FailureStatusCode_IsDisposed(HttpStatusCode statusCode)
        {
            // Arrange
            var response = new TestHttpResponseMessage(statusCode);
            var httpClient = new HttpClient(new TestHttpMessageHandler
            {
                Response = response
            });
            var azureContentSafetyClient = new AzureContentSafetyClient(new AzureContentSafetyClientOptions("test-key", "https://test-endpoint"), null, httpClient);

            // Action
            var exception = await Assert.ThrowsAsync<HttpOperationException>(async () => await azureContentSafetyClient.ExecuteTextModeration(new AzureContentSafetyTextAnalysisRequest("test-text")));

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
