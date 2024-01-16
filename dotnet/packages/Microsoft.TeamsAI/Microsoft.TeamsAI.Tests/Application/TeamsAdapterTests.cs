using System.Net.Http.Headers;
using System.Reflection;

namespace Microsoft.Teams.AI.Tests.Application
{
    public class TeamsAdapterTests
    {
        [Fact]
        public void Test_TeamsAdapter_HasDefaultHeaders()
        {
            string version = Assembly.GetAssembly(typeof(TeamsAdapter))?.GetName().Version?.ToString() ?? "";
            ProductInfoHeaderValue productInfo = new("teamsai-dotnet", version);
            TeamsAdapter adapter = new();
            Assert.NotNull(adapter.HttpClientFactory);

            HttpClient client = adapter.HttpClientFactory.CreateClient();
            Assert.NotNull(client);
            Assert.True(client.DefaultRequestHeaders.UserAgent.Contains(productInfo));
        }
    }
}
